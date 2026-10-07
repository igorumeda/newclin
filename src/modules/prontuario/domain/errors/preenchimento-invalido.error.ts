import { ValidationError } from '@core/domain/errors/validation.error';

export type PreenchimentoInvalidoErrorParams = { pendencias: string[] };

export class PreenchimentoInvalidoError extends ValidationError {
  public readonly pendencias: string[];

  constructor(params: PreenchimentoInvalidoErrorParams) {
    super({
      message: `Preenchimento inválido: ${params.pendencias.join('; ')}`,
      code: 'PREENCHIMENTO_INVALIDO',
    });
    this.name = 'PreenchimentoInvalidoError';
    this.pendencias = params.pendencias;
  }
}
