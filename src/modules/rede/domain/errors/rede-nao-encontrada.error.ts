import { NotFoundError } from '@core/domain/errors/not-found.error';

export type RedeNaoEncontradaErrorParams = { redeId: string };

export class RedeNaoEncontradaError extends NotFoundError {
  constructor(params: RedeNaoEncontradaErrorParams) {
    super({ message: `Rede "${params.redeId}" não encontrada`, code: 'REDE_NAO_ENCONTRADA' });
    this.name = 'RedeNaoEncontradaError';
  }
}
