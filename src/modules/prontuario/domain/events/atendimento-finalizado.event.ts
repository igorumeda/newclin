import { DomainEvent } from '@core/domain/domain-event.base';

export type AtendimentoFinalizadoEventParams = {
  redeId: string;
  atendimentoId: string;
  pacienteId: string;
  agendamentoId: string | null;
};

export class AtendimentoFinalizadoEvent extends DomainEvent {
  public readonly atendimentoId: string;
  public readonly pacienteId: string;
  public readonly agendamentoId: string | null;

  constructor(params: AtendimentoFinalizadoEventParams) {
    super({ name: 'atendimento.finalizado', redeId: params.redeId });
    this.atendimentoId = params.atendimentoId;
    this.pacienteId = params.pacienteId;
    this.agendamentoId = params.agendamentoId;
  }
}
