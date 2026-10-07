import { DomainEvent } from '@core/domain/domain-event.base';

export type UsuarioCriadoEventParams = { redeId: string; usuarioId: string; email: string };

export class UsuarioCriadoEvent extends DomainEvent {
  public readonly usuarioId: string;
  public readonly email: string;

  constructor(params: UsuarioCriadoEventParams) {
    super({ name: 'usuario.criado', redeId: params.redeId });
    this.usuarioId = params.usuarioId;
    this.email = params.email;
  }
}
