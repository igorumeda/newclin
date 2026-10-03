/**
 * Middleware de auditoria.
 * Registra automaticamente ações sensíveis das rotas marcadas com `audit`,
 * incluindo quem, quando, o quê, de qual unidade e os dados retornados.
 */
import type { HttpResponse } from '../api/http-response';
import type { AuditRequestOptions, RequestContext } from '../api/request-context.types';
import { Result } from '@core/domain/result';

export type AuditEntryInput = {
  redeId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  unidadeId: string | null;
  action: string;
  entity: string;
  recordId: string | null;
  description: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
};

export type IAuditWriter = {
  write(entry: AuditEntryInput): Promise<Result<void>>;
};

export type BuildAuditEntryParams = {
  context: RequestContext;
  options: AuditRequestOptions;
  response: HttpResponse;
};

export function buildAuditEntry(params: BuildAuditEntryParams): AuditEntryInput {
  const { context, options, response } = params;
  const body = response.body as { data?: Record<string, unknown> } | null;
  const data = body?.data ?? {};
  const recordId = typeof data.id === 'string' ? data.id : null;
  const unidadeId = typeof data.unidadeId === 'string' ? data.unidadeId : null;

  return {
    redeId: context.redeId,
    userId: context.userId,
    userName: context.userName,
    userEmail: context.userEmail,
    userRole: context.role,
    unidadeId,
    action: options.action,
    entity: options.entity,
    recordId,
    description: options.description ?? null,
    before: null,
    after: data,
    ip: context.ip,
    userAgent: context.userAgent,
  };
}

export type CreateAuditRecorderParams = { writer: IAuditWriter };

export function createAuditRecorder(params: CreateAuditRecorderParams) {
  const { writer } = params;

  return async function record(recordParams: BuildAuditEntryParams): Promise<void> {
    const entry = buildAuditEntry(recordParams);
    await writer.write(entry);
  };
}
