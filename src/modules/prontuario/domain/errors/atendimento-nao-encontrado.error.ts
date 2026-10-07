import { NotFoundError } from '@core/domain/errors/not-found.error';

export type AtendimentoNaoEncontradoErrorParams = { atendimentoId: string };

export class AtendimentoNaoEncontradoError extends NotFoundError {
  constructor(params: AtendimentoNaoEncontradoErrorParams) {
    super({
      message: `Atendimento "${params.atendimentoId}" não encontrado`,
      code: 'ATENDIMENTO_NAO_ENCONTRADO',
    });
    this.name = 'AtendimentoNaoEncontradoError';
  }
}
