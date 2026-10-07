import { DomainError } from '@core/domain/errors/domain-error.base';

export type TransicaoStatusInvalidaErrorParams = { origem: string; destino: string };

export class TransicaoStatusInvalidaError extends DomainError {
  constructor(params: TransicaoStatusInvalidaErrorParams) {
    super({
      message: `Não é possível mudar o status de "${params.origem}" para "${params.destino}"`,
      code: 'TRANSICAO_STATUS_INVALIDA',
    });
    this.name = 'TransicaoStatusInvalidaError';
  }
}
