import { NotFoundError } from '@core/domain/errors/not-found.error';

export type BloqueioNaoEncontradoErrorParams = { bloqueioId: string };

export class BloqueioNaoEncontradoError extends NotFoundError {
  constructor(params: BloqueioNaoEncontradoErrorParams) {
    super({
      message: `Bloqueio "${params.bloqueioId}" não encontrado`,
      code: 'BLOQUEIO_NAO_ENCONTRADO',
    });
    this.name = 'BloqueioNaoEncontradoError';
  }
}
