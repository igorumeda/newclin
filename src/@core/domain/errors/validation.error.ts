import { DomainError } from './domain-error.base';

export type ValidationErrorParams = { message: string; code?: string; field?: string };

export class ValidationError extends DomainError {
  public readonly field?: string;

  constructor(params: ValidationErrorParams) {
    super({ message: params.message, code: params.code ?? 'VALIDATION_ERROR' });
    this.field = params.field;
    this.name = 'ValidationError';
  }
}
