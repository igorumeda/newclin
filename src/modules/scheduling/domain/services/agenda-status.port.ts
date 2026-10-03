import type { Agendamento } from '../entities/agendamento.entity';
import type { IAgendaNotificacaoPort } from './agenda-notificacao.interface';

/**
 * Efeitos colaterais do cancelamento de um agendamento: a fila de notificações
 * pendente é descartada e o paciente (quando aplicável) é avisado.
 */
export type AoCancelarParams = {
  agendamentoId: string;
  motivo: string;
  agendamento: Agendamento;
};

export interface IEstadoAgendamentoPort {
  aoCancelar(params: AoCancelarParams): Promise<void>;
}

/** Implementação padrão: usa a porta de notificação da agenda. */
export class EstadoAgendamentoNotificacao implements IEstadoAgendamentoPort {
  private readonly notificacao: IAgendaNotificacaoPort | null;

  constructor(notificacao: IAgendaNotificacaoPort | null) {
    this.notificacao = notificacao;
  }

  async aoCancelar(params: AoCancelarParams): Promise<void> {
    if (!this.notificacao) return;

    await this.notificacao.cancelarNotificacoesPendentes({
      agendamentoId: params.agendamentoId,
      motivo: params.motivo,
    });
  }
}
