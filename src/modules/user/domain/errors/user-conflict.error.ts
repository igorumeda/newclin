import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';

export type EmailAlreadyInUseErrorParams = { email: string };

export class EmailAlreadyInUseError extends ConflictError {
  constructor(params: EmailAlreadyInUseErrorParams) {
    super({
      message: `Já existe um usuário com o e-mail "${params.email}" nesta rede`,
      code: 'EMAIL_ALREADY_IN_USE',
    });
    this.name = 'EmailAlreadyInUseError';
  }
}

export type InvalidUserOperationErrorParams = { reason: string };

export class InvalidUserOperationError extends ValidationError {
  constructor(params: InvalidUserOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_USER_OPERATION' });
    this.name = 'InvalidUserOperationError';
  }
}
