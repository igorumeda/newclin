import { DomainEvent } from '@core/domain/domain-event.base';

export type AgendamentoCriadoEventParams = {
  redeId: string;
  agendamentoId: string;
  pacienteId: string;
};

export class AgendamentoCriadoEvent extends DomainEvent {
  public readonly agendamentoId: string;
  public readonly pacienteId: string;

  constructor(params: AgendamentoCriadoEventParams) {
    super({ name: 'agendamento.criado', redeId: params.redeId });
    this.agendamentoId = params.agendamentoId;
    this.pacienteId = params.pacienteId;
  }
}
