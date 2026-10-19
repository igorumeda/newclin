import { DomainEvent } from '@core/domain/domain-event.base';

export type UsuarioCriadoEventParams = { usuarioId: string; email: string; role: string };

export class UsuarioCriadoEvent extends DomainEvent {
  public readonly usuarioId: string;
  public readonly email: string;
  public readonly role: string;

  constructor(params: UsuarioCriadoEventParams) {
    super({ name: 'usuario.criado' });
    this.usuarioId = params.usuarioId;
    this.email = params.email;
    this.role = params.role;
  }
}
