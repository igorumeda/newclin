import { DomainEvent } from '@core/domain/domain-event.base';

export type PacienteCriadoEventParams = { redeId: string; pacienteId: string; nome: string };

export class PacienteCriadoEvent extends DomainEvent {
  public readonly pacienteId: string;
  public readonly nome: string;

  constructor(params: PacienteCriadoEventParams) {
    super({ name: 'paciente.criado', redeId: params.redeId });
    this.pacienteId = params.pacienteId;
    this.nome = params.nome;
  }
}
