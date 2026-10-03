import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import type { StatusAgendamento } from '../value-objects/status-agendamento.vo';

export type AgendamentoNotFoundErrorParams = { agendamentoId: string };

export class AgendamentoNotFoundError extends NotFoundError {
  constructor(params: AgendamentoNotFoundErrorParams) {
    super({
      message: `Agendamento "${params.agendamentoId}" não encontrado`,
      code: 'AGENDAMENTO_NOT_FOUND',
    });
    this.name = 'AgendamentoNotFoundError';
  }
}

export type ConflitoAgendaDetalhe = {
  agendamentoId: string;
  pacienteId: string;
  pacienteNome: string;
  inicio: string;
  fim: string;
  status: string;
  encaixe: boolean;
};

export type ConflitoAgendaErrorParams = { detalhes: ConflitoAgendaDetalhe[] };

/** Conflito bloqueante (§3.4): só o encaixe pode sobrepor, com justificativa. */
export class ConflitoAgendaError extends ConflictError {
  public readonly detalhes: ConflitoAgendaDetalhe[];

  constructor(params: ConflitoAgendaErrorParams) {
    const conflito = params.detalhes[0];
    super({
      message: conflito
        ? `Conflito de horário com ${conflito.pacienteNome} (${conflito.inicio} → ${conflito.fim}). Use encaixe justificado para sobrepor.`
        : 'Conflito de horário na agenda deste profissional.',
      code: 'CONFLITO_AGENDA',
    });
    this.name = 'ConflitoAgendaError';
    this.detalhes = params.detalhes;
  }
}

export type BloqueioAgendaDetalhe = {
  bloqueioId: string;
  tipo: string;
  motivo: string | null;
  inicio: string;
  fim: string;
};

export type BloqueioAgendaErrorParams = { detalhes: BloqueioAgendaDetalhe[] };

/** O horário escolhido cai em férias/almoço/manutenção do profissional. */
export class BloqueioAgendaError extends ConflictError {
  public readonly detalhes: BloqueioAgendaDetalhe[];

  constructor(params: BloqueioAgendaErrorParams) {
    const bloqueio = params.detalhes[0];
    super({
      message: bloqueio
        ? `Horário bloqueado na agenda (${bloqueio.tipo}${bloqueio.motivo ? `: ${bloqueio.motivo}` : ''})`
        : 'Horário bloqueado na agenda',
      code: 'BLOQUEIO_AGENDA',
    });
    this.name = 'BloqueioAgendaError';
    this.detalhes = params.detalhes;
  }
}

export type TransicaoStatusInvalidaErrorParams = {
  de: StatusAgendamento;
  para: StatusAgendamento;
};

export class TransicaoStatusInvalidaError extends ValidationError {
  constructor(params: TransicaoStatusInvalidaErrorParams) {
    super({
      message: `Transição de status inválida: ${params.de} → ${params.para}`,
      code: 'TRANSICAO_STATUS_INVALIDA',
    });
    this.name = 'TransicaoStatusInvalidaError';
  }
}

export type EncaixeNaoPermitidoErrorParams = { reason: string };

export class EncaixeNaoPermitidoError extends ValidationError {
  constructor(params: EncaixeNaoPermitidoErrorParams) {
    super({ message: params.reason, code: 'ENCAIXE_NAO_PERMITIDO' });
    this.name = 'EncaixeNaoPermitidoError';
  }
}

export type TipoAtendimentoNotFoundErrorParams = { tipoAtendimentoId: string };

export class TipoAtendimentoNotFoundError extends NotFoundError {
  constructor(params: TipoAtendimentoNotFoundErrorParams) {
    super({
      message: `Tipo de atendimento "${params.tipoAtendimentoId}" não encontrado`,
      code: 'TIPO_ATENDIMENTO_NOT_FOUND',
    });
    this.name = 'TipoAtendimentoNotFoundError';
  }
}

export type TipoAtendimentoDuplicadoErrorParams = { nome: string };

export class TipoAtendimentoDuplicadoError extends ConflictError {
  constructor(params: TipoAtendimentoDuplicadoErrorParams) {
    super({
      message: `Já existe um tipo de atendimento chamado "${params.nome}" nesta rede`,
      code: 'TIPO_ATENDIMENTO_DUPLICADO',
    });
    this.name = 'TipoAtendimentoDuplicadoError';
  }
}

export type BloqueioNotFoundErrorParams = { bloqueioId: string };

export class BloqueioNotFoundError extends NotFoundError {
  constructor(params: BloqueioNotFoundErrorParams) {
    super({
      message: `Bloqueio "${params.bloqueioId}" não encontrado`,
      code: 'BLOQUEIO_NOT_FOUND',
    });
    this.name = 'BloqueioNotFoundError';
  }
}

export type InvalidSchedulingOperationErrorParams = { reason: string };

export class InvalidSchedulingOperationError extends ValidationError {
  constructor(params: InvalidSchedulingOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_SCHEDULING_OPERATION' });
    this.name = 'InvalidSchedulingOperationError';
  }
}
