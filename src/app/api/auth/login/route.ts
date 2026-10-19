import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteClient } from '@/server/config/supabase.config';
import { getContainer, lazyControllers } from '@/server/di/container';
import { HttpResponse } from '@/server/api/http-response';
import { logError, mapError } from '@/server/middlewares/error.middleware';
import { authenticate } from '@/server/middlewares/auth.middleware';
import { registraAcesso } from '@/server/middlewares/session-acesso.middleware';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

const DESTINO_POR_PAPEL: Record<string, string> = {
  admin_rede: '/dashboard',
  gestor_unidade: '/dashboard',
  profissional: '/agenda',
  recepcao: '/recepcao',
};

/** POST /api/auth/login — autentica no Supabase e devolve o perfil + permissões. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const corpo = loginSchema.parse(await request.json());
    const supabase = createRouteClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: corpo.email.toLowerCase(),
      password: corpo.senha,
    });

    if (error) {
      if (!error.status || error.status >= 500) {
        logError({
          level: 'error',
          message: 'Falha do Supabase Auth durante o login',
          context: { status: error.status, code: error.code, name: error.name },
        });
        return HttpResponse.serviceUnavailable(
          'Não foi possível acessar o serviço de autenticação. Tente novamente mais tarde.',
        ).toNextResponse();
      }
      return HttpResponse.unauthorized('E-mail ou senha inválidos').toNextResponse();
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = request.headers.get('user-agent');

    const contexto = await authenticate({ ip, userAgent });
    if (contexto.isFailure) return HttpResponse.fromDomainError(contexto.error).toNextResponse();

    const controllers = lazyControllers();
    const resposta = await controllers.usuario.handle({
      action: 'perfil-atual',
      context: contexto.value,
    });

    if (resposta.status >= 400) return resposta.toNextResponse();

    await registraAcesso({ supabase, usuarioId: contexto.value.userId });
    await getContainer().auditRecorder({
      context: contexto.value,
      options: { action: 'login' as never, entity: 'auth', description: 'Login no sistema' },
      response: resposta,
    });

    const corpoResposta = resposta.body as { data?: { usuario?: { role?: string } } };
    const papel = corpoResposta.data?.usuario?.role ?? 'recepcao';

    return HttpResponse.ok({
      ...(corpoResposta.data ?? {}),
      redirectTo: DESTINO_POR_PAPEL[papel] ?? '/dashboard',
    }).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}
