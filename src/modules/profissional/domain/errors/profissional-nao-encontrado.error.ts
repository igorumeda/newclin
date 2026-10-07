import { NotFoundError } from '@core/domain/errors/not-found.error';

export type ProfissionalNaoEncontradoErrorParams = { profissionalId: string };

export class ProfissionalNaoEncontradoError extends NotFoundError {
  constructor(params: ProfissionalNaoEncontradoErrorParams) {
    super({
      message: `Profissional "${params.profissionalId}" não encontrado`,
      code: 'PROFISSIONAL_NAO_ENCONTRADO',
    });
    this.name = 'ProfissionalNaoEncontradoError';
  }
}
