import type { HttpHeaders, HttpResponsePayload } from './http.types';

export type OkParams<T> = { data: T; meta?: Record<string, unknown>; headers?: HttpHeaders };
export type ErrorParams = { message: string; code?: string; details?: unknown };
export type BinaryParams = { body: unknown; contentType: string; headers?: HttpHeaders };

/** Fábrica das respostas padronizadas da API (ver ARCHITECTURE.md §12.2). */
export class HttpResponse {
  public static ok<T>({ data, meta, headers }: OkParams<T>): HttpResponsePayload {
    return { status: 200, body: meta ? { data, meta } : { data }, headers };
  }

  public static created<T>({ data, headers }: OkParams<T>): HttpResponsePayload {
    return { status: 201, body: { data }, headers };
  }

  public static noContent(): HttpResponsePayload {
    return { status: 204, body: null };
  }

  public static badRequest({
    message,
    code = 'BAD_REQUEST',
    details,
  }: ErrorParams): HttpResponsePayload {
    return { status: 400, body: { error: { code, message, details } } };
  }

  public static unauthorized({
    message = 'Sessão inválida ou expirada',
    code = 'UNAUTHORIZED',
  }: Partial<ErrorParams> = {}): HttpResponsePayload {
    return { status: 401, body: { error: { code, message } } };
  }

  public static forbidden({
    message = 'Você não tem permissão para esta ação',
    code = 'FORBIDDEN',
  }: Partial<ErrorParams> = {}): HttpResponsePayload {
    return { status: 403, body: { error: { code, message } } };
  }

  public static notFound({
    message = 'Registro não encontrado',
    code = 'NOT_FOUND',
  }: Partial<ErrorParams> = {}): HttpResponsePayload {
    return { status: 404, body: { error: { code, message } } };
  }

  public static conflict({ message, code = 'CONFLICT', details }: ErrorParams): HttpResponsePayload {
    return { status: 409, body: { error: { code, message, details } } };
  }

  public static unprocessable({
    message,
    code = 'UNPROCESSABLE_ENTITY',
    details,
  }: ErrorParams): HttpResponsePayload {
    return { status: 422, body: { error: { code, message, details } } };
  }

  public static serverError({
    message = 'Erro interno do servidor',
    code = 'INTERNAL_ERROR',
  }: Partial<ErrorParams> = {}): HttpResponsePayload {
    return { status: 500, body: { error: { code, message } } };
  }
}
