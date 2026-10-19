import { DomainError } from './domain-error.base';
import type { DomainErrorParams } from './domain-error.base';

/**
 * Erros de infraestrutura (banco, storage, provedores externos).
 * São os únicos que podem atravessar a fronteira como exception — mas também
 * são normalizados em Result para manter o contrato dos Use Cases.
 */
export abstract class InfrastructureError extends DomainError {
  public readonly cause?: unknown;

  protected constructor(params: DomainErrorParams & { cause?: unknown }) {
    super(params);
    this.cause = params.cause;
  }
}
