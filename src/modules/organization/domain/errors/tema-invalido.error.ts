import { ValidationError } from '@core/domain/errors/validation.error';

type TemaInvalidoParams = { reason: string };

export class TemaInvalidoError extends ValidationError {
  constructor(params: TemaInvalidoParams) {
    super({ message: params.reason, code: 'TEMA_INVALIDO' });
  }
}
