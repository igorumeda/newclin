import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { InfrastructureError } from '@core/domain/errors/infrastructure.error';

export type NotificacaoNotFoundErrorParams = { notificacaoId: string };

export class NotificacaoNotFoundError extends NotFoundError {
  constructor(params: NotificacaoNotFoundErrorParams) {
    super({
      message: `Notificação "${params.notificacaoId}" não encontrada`,
      code: 'NOTIFICACAO_NOT_FOUND',
    });
    this.name = 'NotificacaoNotFoundError';
  }
}

export type ModeloMensagemNotFoundErrorParams = { canal: string; tipo: string };

export class ModeloMensagemNotFoundError extends NotFoundError {
  constructor(params: ModeloMensagemNotFoundErrorParams) {
    super({
      message: `Modelo de mensagem não encontrado para o canal "${params.canal}" e tipo "${params.tipo}"`,
      code: 'MODELO_MENSAGEM_NOT_FOUND',
    });
    this.name = 'ModeloMensagemNotFoundError';
  }
}

export type DestinoIndisponivelErrorParams = { canal: string; motivo: string };

/** Paciente sem e-mail/telefone cadastrado: não é erro de sistema, é dado ausente. */
export class DestinoIndisponivelError extends ValidationError {
  constructor(params: DestinoIndisponivelErrorParams) {
    super({
      message: `Não foi possível enviar por ${params.canal}: ${params.motivo}`,
      code: 'DESTINO_INDISPONIVEL',
    });
    this.name = 'DestinoIndisponivelError';
  }
}

export type NotificationProviderErrorParams = { provider: string; motivo: string; cause?: unknown };

export class NotificationProviderError extends InfrastructureError {
  constructor(params: NotificationProviderErrorParams) {
    super({
      message: `Falha no provedor de notificações "${params.provider}": ${params.motivo}`,
      code: 'NOTIFICATION_PROVIDER_ERROR',
      cause: params.cause,
    });
    this.name = 'NotificationProviderError';
  }
}

export type InvalidNotificationOperationErrorParams = { reason: string };

export class InvalidNotificationOperationError extends ValidationError {
  constructor(params: InvalidNotificationOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_NOTIFICATION_OPERATION' });
    this.name = 'InvalidNotificationOperationError';
  }
}
