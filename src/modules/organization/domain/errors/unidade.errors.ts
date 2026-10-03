import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';

export type UnidadeNotFoundErrorParams = { unidadeId: string };

export class UnidadeNotFoundError extends NotFoundError {
  constructor(params: UnidadeNotFoundErrorParams) {
    super({
      message: `Unidade com ID "${params.unidadeId}" não encontrada`,
      code: 'UNIDADE_NOT_FOUND',
    });
    this.name = 'UnidadeNotFoundError';
  }
}

export type UnidadeNomeDuplicadoErrorParams = { nome: string };

export class UnidadeNomeDuplicadoError extends ConflictError {
  constructor(params: UnidadeNomeDuplicadoErrorParams) {
    super({
      message: `Já existe uma unidade com o nome "${params.nome}" nesta rede`,
      code: 'UNIDADE_NOME_DUPLICADO',
    });
    this.name = 'UnidadeNomeDuplicadoError';
  }
}

export type InvalidUnitOperationErrorParams = { reason: string };

export class InvalidUnitOperationError extends ValidationError {
  constructor(params: InvalidUnitOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_UNIT_OPERATION' });
    this.name = 'InvalidUnitOperationError';
  }
}

export type RedeNotFoundErrorParams = { redeId: string };

export class RedeNotFoundError extends NotFoundError {
  constructor(params: RedeNotFoundErrorParams) {
    super({ message: `Rede com ID "${params.redeId}" não encontrada`, code: 'REDE_NOT_FOUND' });
    this.name = 'RedeNotFoundError';
  }
}
