/**
 * Adaptador de rotas HTTP (App Router).
 * Executa o pipeline: validação → autenticação → autorização → controller →
 * auditoria → resposta padronizada. Os arquivos em `src/app/api/**` apenas
 * declaram o método HTTP, os papéis permitidos e o handler do módulo.
 */
import { NextResponse } from 'next/server';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import { mapError, logError } from '../middlewares/error.middleware';
import { HttpResponse } from './http-response';
import type { AppRole, AuditRequestOptions, RequestContext } from './request-context.types';

export type RouteHandlerParams = {
  context: RequestContext;
  body: unknown;
  query: URLSearchParams;
  params: Record<string, string>;
};

export type RouteHandler = (params: RouteHandlerParams) => Promise<HttpResponse>;

export type RouteDefinition = {
  request: Request;
  handler: RouteHandler;
  params?: Record<string, string>;
  allowedRoles?: AppRole[];
  audit?: AuditRequestOptions;
  requireAuth?: boolean;
  publicRoute?: boolean;
};

export type AuditRecorder = (params: {
  context: RequestContext;
  options: AuditRequestOptions;
  response: HttpResponse;
}) => Promise<void>;

type AuditRecorderLoader = () => AuditRecorder | null;

let loadAuditRecorder: AuditRecorderLoader = () => null;

/** O container de DI registra o gravador de auditoria no bootstrap do servidor. */
export function registerAuditRecorder(loader: AuditRecorderLoader): void {
  loadAuditRecorder = loader;
}

function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

async function parseBody(request: Request): Promise<unknown> {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'DELETE') return null;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) return null;
  if (!contentType.includes('application/json')) return null;

  const text = await request.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractRecordId(response: HttpResponse): string | null {
  const body = response.body as { data?: unknown } | null;
  const data = body?.data;
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  return typeof record.id === 'string' ? record.id : null;
}

export async function handleRoute(definition: RouteDefinition): Promise<NextResponse> {
  const query = new URLSearchParams(new URL(definition.request.url).searchParams);
  const params = definition.params ?? {};
  let context: RequestContext | null = null;

  try {
    const body = await parseBody(definition.request);

    if (definition.publicRoute) {
      const response = await definition.handler({
        context: createAnonymousContext(definition.request),
        body,
        query,
        params,
      });
      return response.toNextResponse();
    }

    const authResult = await authenticate({
      ip: extractClientIp(definition.request),
      userAgent: definition.request.headers.get('user-agent'),
    });

    if (authResult.isFailure) {
      return HttpResponse.fromDomainError(authResult.error).toNextResponse();
    }

    context = authResult.value;

    const authorization = authorize({ context, allowedRoles: definition.allowedRoles });
    if (authorization.isFailure) {
      return HttpResponse.fromDomainError(authorization.error).toNextResponse();
    }

    const response = await definition.handler({ context, body, query, params });

    if (definition.audit && response.status < 400) {
      const recorder = loadAuditRecorder();
      if (recorder) {
        await recorder({ context, options: definition.audit, response });
      }
    }

    return response.toNextResponse();
  } catch (error) {
    const mapped = mapError(error);
    logError({
      message: mapped.logMessage,
      level: mapped.logLevel,
      context: {
        url: definition.request.url,
        method: definition.request.method,
        userId: context?.userId ?? null,
      },
    });
    return mapped.response.toNextResponse();
  }
}

export type JsonHandler = (request: Request, params?: Record<string, string>) => Promise<NextResponse>;

/** Wrapper opcional para serializar o result do handler sem repetição. */
export function auditRecordId(response: HttpResponse): string | null {
  return extractRecordId(response);
}

function createAnonymousContext(request: Request): RequestContext {
  return {
    userId: 'anonymous',
    userName: 'Público',
    userEmail: '',
    role: 'recepcao',
    redeId: '',
    unidadesAcesso: [],
    profissionalId: null,
    ip: extractClientIp(request),
    userAgent: request.headers.get('user-agent'),
  };
}
