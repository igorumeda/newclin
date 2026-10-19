import { z } from 'zod';
import { createRouteClient, createServiceClient } from '@/server/config/supabase.config';
import { HttpResponse } from '@/server/api/http-response';
import { isTrustedRequestOrigin } from '@/server/api/request-origin';
import { getEnv } from '@/server/config/env.config';
import { getContainer } from '@/server/di/container';
import { mapError } from '@/server/middlewares/error.middleware';
import { obterConvitePendente } from '../../infrastructure/providers/convite-pendente.provider';

const sessaoSchema = z.union([
  z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1) }),
  z.object({ token_hash: z.string().min(1) }),
  z.object({ code: z.string().min(1) }),
]);
const cadastroSchema = z.object({
  nome: z.string(),
  telefone: z.string(),
  senha: z.string(),
  confirmarSenha: z.string(),
});

/** Troca o convite por cookies de sessão; nunca devolve tokens para a UI. */
export async function aceitarConviteRoute(request: Request) {
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
              type: 'invite',
            })
          : await supabase.auth.exchangeCodeForSession(corpo.code);
    if (resposta.error)
      return HttpResponse.unauthorized(
        'Convite inválido ou expirado. Peça um novo convite ao administrador.',
      ).toNextResponse();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.invited_at) {
      await supabase.auth.signOut();
      return HttpResponse.forbidden(
        'Este link não corresponde a um convite válido.',
      ).toNextResponse();
    }
    return HttpResponse.ok({ validado: true }).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}

export async function obterConviteRoute() {
  try {
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.invited_at)
      return HttpResponse.unauthorized(
        'Abra o link do convite enviado por e-mail.',
      ).toNextResponse();
    if (data.user.app_metadata.cadastro_concluido === true)
      return HttpResponse.conflict(
        'Seu cadastro já foi concluído. Entre com seu e-mail e senha.',
      ).toNextResponse();
    const pendente = await obterConvitePendente({
      user: data.user,
      serviceClient: createServiceClient(),
    });
    if (!pendente)
      return HttpResponse.forbidden(
        'Convite sem vínculo válido com a rede.',
      ).toNextResponse();
    return HttpResponse.ok({
      nome: pendente.convite.nome,
      telefone: pendente.convite.telefone ?? '',
      email: pendente.convite.email,
    }).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}

export async function concluirConviteRoute(request: Request) {
  try {
    if (!isTrustedRequestOrigin(request, getEnv().NEXT_PUBLIC_APP_URL))
      return HttpResponse.forbidden(
        'Origem inválida para concluir o convite.',
      ).toNextResponse();
    const supabase = createRouteClient();
    const { data, error } = await supabase.auth.getUser();
    if (
      error ||
      !data.user?.invited_at ||
      data.user.app_metadata.cadastro_concluido === true
    )
      return HttpResponse.forbidden(
        'Este convite não está disponível para conclusão de cadastro.',
      ).toNextResponse();
    const pendente = await obterConvitePendente({
      user: data.user,
      serviceClient: createServiceClient(),
    });
    if (!pendente)
      return HttpResponse.forbidden(
        'Convite sem vínculo válido com a rede.',
      ).toNextResponse();
    const input = cadastroSchema.parse(await request.json());
    const container = getContainer();
    const result = await container.modules.usuario.useCases.concluirCadastro.execute({
      ...input,
      ...pendente,
      authUserId: data.user.id,
    });
    if (result.isFailure)
      return HttpResponse.fromDomainError(result.error).toNextResponse();
    await supabase.auth.signOut();
    return HttpResponse.ok(result.value).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}
