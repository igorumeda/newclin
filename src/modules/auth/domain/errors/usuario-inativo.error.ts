import { ForbiddenError } from '@core/domain/errors/forbidden.error';

export class UsuarioInativoError extends ForbiddenError {
  constructor() {
    super({ message: 'Usuário inativo. Procure o administrador da rede.', code: 'USUARIO_INATIVO' });
    this.name = 'UsuarioInativoError';
  }
}
