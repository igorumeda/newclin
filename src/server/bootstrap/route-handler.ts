/**
 * Adaptador entre o App Router do Next.js e os controllers da camada
 * `server/api`. Aqui — e somente aqui — a transação multi-tenant é aberta,
 * o container de dependências é montado e a auditoria é registrada.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { podePermissao } from '@/modules/auth/domain/value-objects/papel.vo';
import type { Permissao } from '@/modules/auth/domain/value-objects/papel.vo';
import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type {
  AuthenticatedUser,
  HttpMethod,
  HttpQuery,
  HttpRequest,
  HttpResponsePayload,
  HttpRouteParams,
} from '@/server/api/http.types';
import { getDatabaseClient } from '@/server/infrastructure/database/database.factory';
import { ApplicationContainer } from '@/server/di/container';
import { lerSessao } from './session';

export type RouteContext = { params?: HttpRouteParams };
export type ControllerFactory = (
  container: ApplicationContainer,
) => Controller<HttpRequest, HttpResponsePayload>;

export type AuditoriaRota = { entidade: string; registraLeitura?: boolean };

export type AcessoProntuarioInfo = { pacienteId: string; atendimentoId: string | null };
/** Extrai da resposta os dados do acesso clínico a registrar (LGPD). */
export type ExtratorAcessoProntuario = (
  resposta: HttpResponsePayload,
) => AcessoProntuarioInfo | null;

export type RouteHandlerParams = {
  controller: ControllerFactory;
  publica?: boolean;
  permissao?: Permissao;
  auditoria?: AuditoriaRota;
  acessoProntuario?: ExtratorAcessoProntuario;
};

export type NextRouteHandler = (
  request: NextRequest,
  context: RouteContext,
) => Promise<NextResponse>;

type ConstruirRequisicaoParams = {
  request: NextRequest;
  context: RouteContext;
  usuario: AuthenticatedUser | null;
};
type RegistrarAcessoParams = {
  container: ApplicationContainer;
  requisicao: HttpRequest;
  extrator: ExtratorAcessoProntuario;
  resposta: HttpResponsePayload;
};
type RegistrarAuditoriaParams = {
  container: ApplicationContainer;
  requisicao: HttpRequest;
  auditoria: AuditoriaRota;
  resposta: HttpResponsePayload;
};

const ACAO_POR_METODO: Record<HttpMethod, string> = {
  GET: 'visualizar',
  POST: 'criar',
  PUT: 'atualizar',
  PATCH: 'atualizar',
  DELETE: 'excluir',
};

async function lerCorpo(request: NextRequest): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'DELETE') return null;
  const tipo = request.headers.get('content-type') ?? '';
  try {
    if (tipo.includes('application/json')) return await request.json();
    if (tipo.includes('form')) return Object.fromEntries((await request.formData()).entries());
    const texto = await request.text();
    return texto ? { texto } : null;
  } catch {
    return null;
  }
}

async function construirRequisicao({
  request,
  context,
  usuario,
}: ConstruirRequisicaoParams): Promise<HttpRequest> {
  const query: HttpQuery = {};
  request.nextUrl.searchParams.forEach((valor, chave) => {
    query[chave] = valor;
  });

  return {
    method: request.method as HttpMethod,
    path: request.nextUrl.pathname,
    params: context.params ?? {},
    query,
    body: await lerCorpo(request),
    usuario,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '',
    userAgent: request.headers.get('user-agent') ?? '',
  };
}

async function registrarAuditoria({
  container,
  requisicao,
  auditoria,
  resposta,
}: RegistrarAuditoriaParams): Promise<void> {
  const usuario = requisicao.usuario;
  if (!usuario) return;
  if (resposta.status >= 400) return;
  if (requisicao.method === 'GET' && !auditoria.registraLeitura) return;

  await container.registrarEventoAuditoria.execute({
    redeId: usuario.redeId,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    acao: ACAO_POR_METODO[requisicao.method],
    entidade: auditoria.entidade,
    entidadeId: requisicao.params.id ?? null,
    descricao: `${requisicao.method} ${requisicao.path}`,
    ip: requisicao.ip || null,
    userAgent: requisicao.userAgent || null,
  });
}

async function registrarAcessoProntuario({
  container,
  requisicao,
  extrator,
  resposta,
}: RegistrarAcessoParams): Promise<void> {
  const usuario = requisicao.usuario;
  if (!usuario || resposta.status >= 400) return;

  const acesso = extrator(resposta);
  if (!acesso) return;

  await container.registrarAcessoProntuario.execute({
    redeId: usuario.redeId,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    pacienteId: acesso.pacienteId,
    atendimentoId: acesso.atendimentoId,
    ip: requisicao.ip || null,
    userAgent: requisicao.userAgent || null,
  });
}

function paraNextResponse(payload: HttpResponsePayload): NextResponse {
  if (payload.status === 204) {
    return new NextResponse(null, { status: 204, headers: payload.headers });
  }
  return NextResponse.json(payload.body, { status: payload.status, headers: payload.headers });
}

export function createRouteHandler({
  controller,
  publica,
  permissao,
  auditoria,
  acessoProntuario,
}: RouteHandlerParams): NextRouteHandler {
  return async (request: NextRequest, context: RouteContext = {}): Promise<NextResponse> => {
    const usuario = await lerSessao();

    if (!publica && !usuario) {
      return paraNextResponse(HttpResponse.unauthorized());
    }
    if (permissao && usuario && !podePermissao({ role: usuario.role, permissao })) {
      return paraNextResponse(HttpResponse.forbidden());
    }

    const requisicao = await construirRequisicao({ request, context, usuario });
    const database = getDatabaseClient();

    try {
      // Rotas públicas (login, webhooks) rodam fora do escopo de rede.
      if (!usuario) {
        const container = new ApplicationContainer({ db: database });
        return paraNextResponse(await controller(container).handle(requisicao));
      }

      const resposta = await database.withTenant({
        redeId: usuario.redeId,
        callback: async (client) => {
          const container = new ApplicationContainer({ db: client });
          const payload = await controller(container).handle(requisicao);
          if (auditoria) {
            await registrarAuditoria({ container, requisicao, auditoria, resposta: payload });
          }
          if (acessoProntuario) {
            await registrarAcessoProntuario({
              container,
              requisicao,
              extrator: acessoProntuario,
              resposta: payload,
            });
          }
          return payload;
        },
      });

      return paraNextResponse(resposta);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro inesperado';
      // eslint-disable-next-line no-console
      console.error(`[api] ${requisicao.method} ${requisicao.path}:`, erro);
      return paraNextResponse(HttpResponse.serverError({ message: mensagem }));
    }
  };
}
