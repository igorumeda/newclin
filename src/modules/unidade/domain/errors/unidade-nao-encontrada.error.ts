import { NotFoundError } from '@core/domain/errors/not-found.error';

export type UnidadeNaoEncontradaErrorParams = { unidadeId: string };

export class UnidadeNaoEncontradaError extends NotFoundError {
  constructor(params: UnidadeNaoEncontradaErrorParams) {
    super({
      message: `Unidade "${params.unidadeId}" não encontrada`,
      code: 'UNIDADE_NAO_ENCONTRADA',
    });
    this.name = 'UnidadeNaoEncontradaError';
  }
}
