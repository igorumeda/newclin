/**
 * Middleware de autorização.
 * Combina papéis permitidos com o escopo de unidades do usuário (§3.2).
 */
import { Result } from '@core/domain/result';
import { ForbiddenError } from '@core/domain/errors/forbidden.error';
import type { AppRole, RequestContext } from '../api/request-context.types';

export type AuthorizeParams = {
  context: RequestContext;
  allowedRoles?: AppRole[];
  requiredUnitId?: string | null;
};

export class AcessoNegadoError extends ForbiddenError {
  constructor(message = 'Você não tem permissão para executar esta ação') {
    super({ message, code: 'ACCESS_DENIED' });
    this.name = 'AcessoNegadoError';
  }
}

export class UnidadeForaDoEscopoError extends ForbiddenError {
  constructor(message = 'Você não tem acesso a esta unidade') {
    super({ message, code: 'UNIT_OUT_OF_SCOPE' });
    this.name = 'UnidadeForaDoEscopoError';
  }
}

export function authorize(params: AuthorizeParams): Result<void> {
  const { context, allowedRoles, requiredUnitId } = params;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(context.role)) {
    return Result.fail(new AcessoNegadoError());
  }

  if (requiredUnitId && !canAccessUnit({ context, unidadeId: requiredUnitId })) {
    return Result.fail(new UnidadeForaDoEscopoError());
  }

  return Result.ok();
}

export type CanAccessUnitParams = { context: RequestContext; unidadeId: string };

export function canAccessUnit(params: CanAccessUnitParams): boolean {
  const { context, unidadeId } = params;
  if (context.role === 'admin_rede') return true;
  return context.unidadesAcesso.includes(unidadeId);
}

export type ResolveUnitScopeParams = {
  context: RequestContext;
  requestedUnitId?: string | null;
};

/**
 * Determina a unidade efetiva de uma operação.
 * Admin pode consultar qualquer unidade da rede; os demais papéis ficam
 * restritos às unidades atribuídas.
 */
export function resolveUnitScope(params: ResolveUnitScopeParams): Result<string | null> {
  const { context, requestedUnitId } = params;

  if (requestedUnitId) {
    if (!canAccessUnit({ context, unidadeId: requestedUnitId })) {
      return Result.fail(new UnidadeForaDoEscopoError());
    }
    return Result.ok(requestedUnitId);
  }

  if (context.role === 'admin_rede') {
    return Result.ok(null);
  }

  return Result.ok(context.unidadesAcesso[0] ?? null);
}

export type ResolveUnitListScopeParams = { context: RequestContext };

export function resolveUnitListScope(params: ResolveUnitListScopeParams): string[] {
  const { context } = params;
  if (context.role === 'admin_rede') return [];
  return context.unidadesAcesso;
}
