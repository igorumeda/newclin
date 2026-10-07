/**
 * Rota de sessão: além de delegar ao controller, grava/limpa o cookie
 * httpOnly — responsabilidade do adaptador HTTP, não do caso de uso.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SessaoController } from '@/modules/auth/server/api/controllers/sessao.controller';
import type { AutenticarUsuarioOutputDto } from '@/modules/auth/application/use-cases/autenticar-usuario/autenticar-usuario.output.dto';
import { loadAppConfig } from '@/server/config/env.config';
import { ApplicationContainer } from '@/server/di/container';
import { getDatabaseClient } from '@/server/infrastructure/database/database.factory';
import { definirCookieSessao, lerSessao, limparCookieSessao } from '@/server/bootstrap/session';
import { HttpResponse } from '@/server/api/http-response';
import type { HttpRequest } from '@/server/api/http.types';

type CorpoLogin = { email?: string; senha?: string };

async function montarRequisicao(request: NextRequest, body: unknown): Promise<HttpRequest> {
  return {
    method: request.method as HttpRequest['method'],
    path: request.nextUrl.pathname,
    params: {},
    query: {},
    body,
    usuario: await lerSessao(),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '',
    userAgent: request.headers.get('user-agent') ?? '',
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = loadAppConfig();
  const container = new ApplicationContainer({ db: getDatabaseClient() });
  const body = (await request.json().catch(() => ({}))) as CorpoLogin;

  const controller = new SessaoController({ autenticarUsuario: container.autenticarUsuario });
  const resposta = await controller.handle(await montarRequisicao(request, body));

  if (resposta.status === 200) {
    const payload = resposta.body as { data: AutenticarUsuarioOutputDto };
    definirCookieSessao({
      token: payload.data.token,
      expiraEmHoras: config.auth.sessionTtlHours,
    });
  }

  return NextResponse.json(resposta.body, { status: resposta.status });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const container = new ApplicationContainer({ db: getDatabaseClient() });
  const controller = new SessaoController({ autenticarUsuario: container.autenticarUsuario });
  const resposta = await controller.handle(await montarRequisicao(request, null));
  return NextResponse.json(resposta.body, { status: resposta.status });
}

export async function DELETE(): Promise<NextResponse> {
  limparCookieSessao();
  const resposta = HttpResponse.ok({ data: { encerrada: true } });
  return NextResponse.json(resposta.body, { status: resposta.status });
}
