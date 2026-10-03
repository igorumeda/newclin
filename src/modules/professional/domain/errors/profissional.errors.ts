import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';

export type ProfissionalNotFoundErrorParams = { profissionalId: string };

export class ProfissionalNotFoundError extends NotFoundError {
  constructor(params: ProfissionalNotFoundErrorParams) {
    super({
      message: `Profissional com ID "${params.profissionalId}" não encontrado`,
      code: 'PROFISSIONAL_NOT_FOUND',
    });
    this.name = 'ProfissionalNotFoundError';
  }
}

export type RegistroDuplicadoErrorParams = { registro: string };

export class RegistroDuplicadoError extends ConflictError {
  constructor(params: RegistroDuplicadoErrorParams) {
    super({
      message: `Já existe um profissional com o registro ${params.registro} nesta rede`,
      code: 'PROFISSIONAL_REGISTRO_DUPLICADO',
    });
    this.name = 'RegistroDuplicadoError';
  }
}

export type InvalidProfessionalOperationErrorParams = { reason: string };

export class InvalidProfessionalOperationError extends ValidationError {
  constructor(params: InvalidProfessionalOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_PROFESSIONAL_OPERATION' });
    this.name = 'InvalidProfessionalOperationError';
  }
}
