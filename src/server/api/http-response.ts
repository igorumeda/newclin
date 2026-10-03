import { NextResponse } from 'next/server';
import { DomainError } from '@core/domain/errors/domain-error.base';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ForbiddenError } from '@core/domain/errors/forbidden.error';
import { UnauthorizedError } from '@core/domain/errors/unauthorized.error';
import { ValidationError } from '@core/domain/errors/validation.error';

export type HttpResponseMeta = Record<string, unknown>;

export type HttpErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * Resposta HTTP padronizada (§12.2 do guia de arquitetura):
 *   sucesso → { data, meta }
 *   erro    → { error: { code, message, details } }
 */
export class HttpResponse {
  private readonly _status: number;
  private readonly _body: unknown;

  private constructor(status: number, body: unknown) {
    this._status = status;
    this._body = body;
  }

  get status(): number {
    return this._status;
  }

  get body(): unknown {
    return this._body;
  }

  public static ok<T>(data: T, meta?: HttpResponseMeta): HttpResponse {
    return new HttpResponse(200, { data, ...(meta ? { meta } : {}) });
  }

  public static created<T>(data: T): HttpResponse {
    return new HttpResponse(201, { data });
  }

  public static noContent(): HttpResponse {
    return new HttpResponse(204, null);
  }

  public static badRequest(message: string, details?: unknown): HttpResponse {
    return HttpResponse.error(400, 'BAD_REQUEST', message, details);
  }

  public static unauthorized(message = 'Sessão inválida ou expirada'): HttpResponse {
    return HttpResponse.error(401, 'UNAUTHORIZED', message);
  }

  public static forbidden(message = 'Você não tem permissão para esta ação'): HttpResponse {
    return HttpResponse.error(403, 'FORBIDDEN', message);
  }

  public static notFound(message = 'Registro não encontrado'): HttpResponse {
    return HttpResponse.error(404, 'NOT_FOUND', message);
  }

  public static conflict(message: string, details?: unknown): HttpResponse {
    return HttpResponse.error(409, 'CONFLICT', message, details);
  }

  public static unprocessable(message: string, details?: unknown): HttpResponse {
    return HttpResponse.error(422, 'VALIDATION_ERROR', message, details);
  }

  public static internalError(message = 'Erro interno ao processar a solicitação'): HttpResponse {
    return HttpResponse.error(500, 'INTERNAL_ERROR', message);
  }

  /** Configuração ausente/indisponível (ex.: credenciais do Supabase). */
  public static serviceUnavailable(message: string): HttpResponse {
    return HttpResponse.error(503, 'SERVICE_UNAVAILABLE', message);
  }

  public static error(status: number, code: string, message: string, details?: unknown): HttpResponse {
    const body: HttpErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
    return new HttpResponse(status, body);
  }

  /** Converte um erro de domínio no status HTTP correspondente. */
  public static fromDomainError(error: Error): HttpResponse {
    if (error instanceof UnauthorizedError) return HttpResponse.unauthorized(error.message);
    if (error instanceof ForbiddenError) return HttpResponse.forbidden(error.message);
    if (error instanceof NotFoundError) return HttpResponse.notFound(error.message);
    if (error instanceof ConflictError) return HttpResponse.conflict(error.message);
    if (error instanceof ValidationError) return HttpResponse.unprocessable(error.message);

    if (error instanceof DomainError) {
      return HttpResponse.error(400, error.code, error.message);
    }

    return HttpResponse.internalError();
  }

  public toNextResponse(): NextResponse {
    if (this._status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(this._body, { status: this._status });
  }
}
