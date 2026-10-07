import { DomainError } from '@core/domain/errors/domain-error.base';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ForbiddenError } from '@core/domain/errors/forbidden.error';
import { HttpResponse } from './http-response';
import type { HttpResponsePayload } from './http.types';

export type MapDomainErrorParams = { error: Error };

/** Traduz erros de domínio em respostas HTTP padronizadas. */
export function mapDomainErrorToHttp({ error }: MapDomainErrorParams): HttpResponsePayload {
  if (error instanceof NotFoundError) {
    return HttpResponse.notFound({ message: error.message, code: error.code });
  }
  if (error instanceof ConflictError) {
    return HttpResponse.conflict({ message: error.message, code: error.code });
  }
  if (error instanceof ForbiddenError) {
    return HttpResponse.forbidden({ message: error.message, code: error.code });
  }
  if (error instanceof DomainError) {
    return HttpResponse.unprocessable({ message: error.message, code: error.code });
  }
  return HttpResponse.badRequest({ message: error.message });
}
