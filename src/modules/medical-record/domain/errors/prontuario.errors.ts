import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import type { ProblemaValidacaoDados } from '../value-objects/dados-prontuario.vo';

export type TemplateNotFoundErrorParams = { templateId: string };

export class TemplateNotFoundError extends NotFoundError {
  constructor(params: TemplateNotFoundErrorParams) {
    super({
      message: `Template de prontuário "${params.templateId}" não encontrado`,
      code: 'TEMPLATE_NOT_FOUND',
    });
    this.name = 'TemplateNotFoundError';
  }
}

export type TemplateDuplicadoErrorParams = { nome: string };

export class TemplateDuplicadoError extends ConflictError {
  constructor(params: TemplateDuplicadoErrorParams) {
    super({
      message: `Já existe um template chamado "${params.nome}" nesta rede`,
      code: 'TEMPLATE_DUPLICADO',
    });
    this.name = 'TemplateDuplicadoError';
  }
}

export type AtendimentoNotFoundErrorParams = { atendimentoId: string };

export class AtendimentoNotFoundError extends NotFoundError {
  constructor(params: AtendimentoNotFoundErrorParams) {
    super({
      message: `Atendimento "${params.atendimentoId}" não encontrado`,
      code: 'ATENDIMENTO_NOT_FOUND',
    });
    this.name = 'AtendimentoNotFoundError';
  }
}

export type AtendimentoFinalizadoErrorParams = { atendimentoId: string };

/** Imutabilidade após finalização (§3.5): correções somente por adendo. */
export class AtendimentoFinalizadoError extends ConflictError {
  constructor(params: AtendimentoFinalizadoErrorParams) {
    super({
      message: 'Atendimento finalizado é imutável. Registre um adendo para corrigir.',
      code: 'ATENDIMENTO_FINALIZADO',
    });
    this.name = 'AtendimentoFinalizadoError';
    this.message = `Atendimento finalizado é imutável. Registre um adendo para corrigir. (${params.atendimentoId})`;
  }
}

export type AtendimentoDuplicadoErrorParams = { agendamentoId: string };

export class AtendimentoDuplicadoError extends ConflictError {
  constructor(params: AtendimentoDuplicadoErrorParams) {
    super({
      message: `Já existe um atendimento vinculado ao agendamento "${params.agendamentoId}"`,
      code: 'ATENDIMENTO_DUPLICADO',
    });
    this.name = 'AtendimentoDuplicadoError';
  }
}

export type DadosInvalidosErrorParams = { problemas: ProblemaValidacaoDados[] };

export class DadosInvalidosError extends ValidationError {
  public readonly problemas: ProblemaValidacaoDados[];

  constructor(params: DadosInvalidosErrorParams) {
    super({
      message:
        params.problemas.length === 1
          ? params.problemas[0].motivo
          : `${params.problemas.length} campos precisam de atenção antes de finalizar o atendimento`,
      code: 'DADOS_PRONTUARIO_INVALIDOS',
    });
    this.name = 'DadosInvalidosError';
    this.problemas = params.problemas;
  }
}

export type AnexoNotFoundErrorParams = { anexoId: string };

export class AnexoNotFoundError extends NotFoundError {
  constructor(params: AnexoNotFoundErrorParams) {
    super({ message: `Anexo "${params.anexoId}" não encontrado`, code: 'ANEXO_NOT_FOUND' });
    this.name = 'AnexoNotFoundError';
  }
}

export type AnexoInvalidoErrorParams = { reason: string };

export class AnexoInvalidoError extends ValidationError {
  constructor(params: AnexoInvalidoErrorParams) {
    super({ message: params.reason, code: 'ANEXO_INVALIDO' });
    this.name = 'AnexoInvalidoError';
  }
}

export type InvalidProntuarioOperationErrorParams = { reason: string };

export class InvalidProntuarioOperationError extends ValidationError {
  constructor(params: InvalidProntuarioOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_PRONTUARIO_OPERATION' });
    this.name = 'InvalidProntuarioOperationError';
  }
}
