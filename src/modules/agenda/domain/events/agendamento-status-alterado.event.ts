import { DomainEvent } from '@core/domain/domain-event.base';
import type { StatusAgendamentoValue } from '../value-objects/status-agendamento.vo';

export type AgendamentoStatusAlteradoEventParams = {
  redeId: string;
  agendamentoId: string;
  statusAnterior: StatusAgendamentoValue;
  statusAtual: StatusAgendamentoValue;
};

export class AgendamentoStatusAlteradoEvent extends DomainEvent {
  public readonly agendamentoId: string;
  public readonly statusAnterior: StatusAgendamentoValue;
  public readonly statusAtual: StatusAgendamentoValue;

  constructor(params: AgendamentoStatusAlteradoEventParams) {
    super({ name: 'agendamento.status-alterado', redeId: params.redeId });
    this.agendamentoId = params.agendamentoId;
    this.statusAnterior = params.statusAnterior;
    this.statusAtual = params.statusAtual;
  }
}
