import { ValidationError } from '@core/domain/errors/validation.error';

export type AnexoInvalidoErrorParams = { motivo: string };

export class AnexoInvalidoError extends ValidationError {
  constructor(params: AnexoInvalidoErrorParams) {
    super({ message: params.motivo, code: 'ANEXO_INVALIDO' });
    this.name = 'AnexoInvalidoError';
  }
}
