import { ValidationError } from '@core/domain/errors/validation.error';
import type { SenhaParams } from '../value-objects/senha.vo';
type SenhaInvalidaParams = { message: string; field: keyof SenhaParams };
export class SenhaInvalidaError extends ValidationError {
  readonly field: keyof SenhaParams;
  constructor(params: SenhaInvalidaParams) {
    super({ message: params.message, code: 'SENHA_INVALIDA' });
    this.field = params.field;
  }
}
