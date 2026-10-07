import { ConflictError } from '@core/domain/errors/conflict.error';

export type ConflitoAgendaErrorParams = { detalhe: string };

export class ConflitoAgendaError extends ConflictError {
  constructor(params: ConflitoAgendaErrorParams) {
    super({
      message: `Conflito de agenda: ${params.detalhe}`,
      code: 'CONFLITO_AGENDA',
    });
    this.name = 'ConflitoAgendaError';
  }
}
