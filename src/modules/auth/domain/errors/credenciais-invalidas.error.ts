import { DomainError } from '@core/domain/errors/domain-error.base';

export class CredenciaisInvalidasError extends DomainError {
  constructor() {
    super({ message: 'E-mail ou senha inválidos', code: 'CREDENCIAIS_INVALIDAS' });
    this.name = 'CredenciaisInvalidasError';
  }
}
