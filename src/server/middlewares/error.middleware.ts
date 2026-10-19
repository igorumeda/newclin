/**
 * Middleware de tratamento de erros.
 * Converte falhas de validação, de domínio e de infraestrutura em respostas
 * HTTP padronizadas, sem vazar detalhes internos.
 */
import { ZodError } from 'zod';
import { HttpResponse } from '../api/http-response';
import { getConfigurationWarnings } from '../config/env.config';

export type MappedError = {
  response: HttpResponse;
  logLevel: 'warn' | 'error';
  logMessage: string;
};

export function mapError(error: unknown): MappedError {
  if (error instanceof ZodError) {
    return {
      response: HttpResponse.unprocessable(
        'Dados inválidos na requisição',
        error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      ),
      logLevel: 'warn',
      logMessage: 'Requisição rejeitada na validação de formato',
    };
  }

  if (error instanceof Error) {
    if (error.name === 'SupabaseNotConfiguredError') {
      return {
        response: HttpResponse.serviceUnavailable(
          `Sistema sem configuração de banco de dados. ${getConfigurationWarnings().join(' | ')}`,
        ),
        logLevel: 'error',
        logMessage: 'Supabase não configurado',
      };
    }

    if (error.message.includes('duplicate key value')) {
      return {
        response: HttpResponse.conflict('Registro duplicado para esta rede'),
        logLevel: 'warn',
        logMessage: error.message,
      };
    }

    if (error.message.includes('agendamentos_sem_conflito')) {
      return {
        response: HttpResponse.conflict(
          'Já existe um atendimento neste horário para o profissional. Utilize encaixe para sobrepor.',
        ),
        logLevel: 'warn',
        logMessage: error.message,
      };
    }

    if (error.message.includes('imutável') || error.message.includes('imutaveis')) {
      return {
        response: HttpResponse.conflict(error.message),
        logLevel: 'warn',
        logMessage: error.message,
      };
    }

    return {
      response: HttpResponse.fromDomainError(error),
      logLevel: 'error',
      logMessage: error.message,
    };
  }

  return {
    response: HttpResponse.internalError(),
    logLevel: 'error',
    logMessage: 'Erro desconhecido',
  };
}

export type ErrorLogParams = {
  message: string;
  level: 'warn' | 'error';
  context?: Record<string, unknown>;
};

/** Logger injetável mínimo — evita `console.log` espalhado pelo código. */
export function logError(params: ErrorLogParams): void {
  const payload = { level: params.level, message: params.message, ...params.context };
  if (params.level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }
  console.warn(JSON.stringify(payload));
}
