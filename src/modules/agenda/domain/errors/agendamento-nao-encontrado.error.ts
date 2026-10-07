import { NotFoundError } from '@core/domain/errors/not-found.error';

export type AgendamentoNaoEncontradoErrorParams = { agendamentoId: string };

export class AgendamentoNaoEncontradoError extends NotFoundError {
  constructor(params: AgendamentoNaoEncontradoErrorParams) {
    super({
      message: `Agendamento "${params.agendamentoId}" não encontrado`,
      code: 'AGENDAMENTO_NAO_ENCONTRADO',
    });
    this.name = 'AgendamentoNaoEncontradoError';
  }
}
