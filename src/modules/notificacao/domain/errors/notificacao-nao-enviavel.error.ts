import { DomainError } from '@core/domain/errors/domain-error.base';

export type NotificacaoNaoEnviavelErrorParams = { motivo: string };

export class NotificacaoNaoEnviavelError extends DomainError {
  constructor(params: NotificacaoNaoEnviavelErrorParams) {
    super({ message: params.motivo, code: 'NOTIFICACAO_NAO_ENVIAVEL' });
    this.name = 'NotificacaoNaoEnviavelError';
  }
}
