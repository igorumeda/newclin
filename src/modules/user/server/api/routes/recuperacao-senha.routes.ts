import { z } from 'zod';
import { createRouteClient } from '@/server/config/supabase.config';
import { HttpResponse } from '@/server/api/http-response';
import { isTrustedRequestOrigin } from '@/server/api/request-origin';
import { getEnv } from '@/server/config/env.config';
import { handleRoute } from '@/server/api/route-adapter';
import { mapError } from '@/server/middlewares/error.middleware';
import { authenticate } from '@/server/middlewares/auth.middleware';
import { Email } from '../../../domain/value-objects/email.vo';
import { Senha } from '../../../domain/value-objects/senha.vo';
import { enviarRecuperacao } from '../../infrastructure/providers/supabase-password-recovery.provider';
import { getContainer } from '@/server/di/container';

const emailSchema = z.object({ email: z.string() });
const senhaSchema = z.object({ senha: z.string(), confirmarSenha: z.string() });
const sessaoSchema = z.union([
  z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1) }),
  z.object({ token_hash: z.string().min(1) }),
  z.object({ code: z.string().min(1) }),
]);

export async function solicitarRecuperacaoRoute(request: Request) {
  try {
    const { email } = emailSchema.parse(await request.json());
    const validacao = Email.create(email);
    if (validacao.isFailure)
      return HttpResponse.unprocessable(validacao.error.message).toNextResponse();
    const { error } = await enviarRecuperacao({ email: validacao.value.value });
    if (error?.status === 429)
      return HttpResponse.error(
        429,
        'RECOVERY_RATE_LIMIT',
        'Aguarde alguns minutos antes de solicitar outro link.',
      ).toNextResponse();
    if (error && (!error.status || error.status >= 500))
      return HttpResponse.serviceUnavailable(
        'Não foi possível enviar o link agora. Tente novamente mais tarde.',
      ).toNextResponse();
    // A resposta não informa se existe uma conta para o endereço fornecido.
    return HttpResponse.ok({ enviado: true }).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}

export async function validarRecuperacaoRoute(request: Request) {
  try {
    if (!isTrustedRequestOrigin(request, getEnv().NEXT_PUBLIC_APP_URL))
      return HttpResponse.forbidden(
        'O endereço usado para abrir o link não corresponde ao endereço da aplicação.',
      ).toNextResponse();
    const corpo = sessaoSchema.parse(await request.json());
    const supabase = createRouteClient();
    const resposta =
      'access_token' in corpo
        ? await supabase.auth.setSession(corpo)
        : 'token_hash' in corpo
          ? await supabase.auth.verifyOtp({
              token_hash: corpo.token_hash,
              type: 'recovery',
            })
          : await supabase.auth.exchangeCodeForSession(corpo.code);
    if (resposta.error)
      return HttpResponse.unauthorized(
        'Link inválido ou expirado. Solicite um novo link para redefinir sua senha.',
      ).toNextResponse();
    const contexto = await authenticate({ ip: null, userAgent: null });
    if (contexto.isFailure) {
      await supabase.auth.signOut();
      return HttpResponse.fromDomainError(contexto.error).toNextResponse();
    }
    return HttpResponse.ok({ validado: true }).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}

export async function obterRecuperacaoRoute(request: Request) {
  return handleRoute({
    request,
    handler: async ({ context }) => HttpResponse.ok({ email: context.userEmail }),
  });
}

export async function redefinirSenhaRoute(request: Request) {
  return handleRoute({
    request,
    handler: async ({ context, body }) => {
      const senha = Senha.create(senhaSchema.parse(body));
      if (senha.isFailure) return HttpResponse.fromDomainError(senha.error);
      const supabase = createRouteClient();
      // O JWT da sessão identifica a conta; o cliente não fornece id nem e-mail.
      const { error } = await supabase.auth.updateUser({ password: senha.value.value });
      if (error)
        return error.status && error.status < 500
          ? HttpResponse.unprocessable(
              error.code === 'same_password'
                ? 'Escolha uma senha diferente da anterior.'
                : 'Não foi possível alterar a senha. Verifique os requisitos e tente novamente.',
            )
          : HttpResponse.serviceUnavailable(
              'Não foi possível alterar a senha agora. Tente novamente mais tarde.',
            );
      await getContainer().auditRecorder({
        context,
        options: {
          action: 'atualizar',
          entity: 'auth',
          description: 'Redefinição de senha por e-mail',
        },
        response: HttpResponse.ok({ concluido: true }),
      });
      await supabase.auth.signOut();
      return HttpResponse.ok({ concluido: true });
    },
  });
}
