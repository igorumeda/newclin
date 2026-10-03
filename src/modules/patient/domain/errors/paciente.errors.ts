import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';

export type PacienteNotFoundErrorParams = { pacienteId: string };

export class PacienteNotFoundError extends NotFoundError {
  constructor(params: PacienteNotFoundErrorParams) {
    super({
      message: `Paciente "${params.pacienteId}" não encontrado`,
      code: 'PACIENTE_NOT_FOUND',
    });
    this.name = 'PacienteNotFoundError';
  }
}

export type PacienteDuplicadoDetalhe = {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  ativo: boolean;
  motivo: 'cpf' | 'nome_data_nascimento';
};

export type PacienteDuplicadoErrorParams = { detalhes: PacienteDuplicadoDetalhe[] };

/** Detecção de duplicidade (§3.3): CPF e fallback por nome + data de nascimento. */
export class PacienteDuplicadoError extends ConflictError {
  public readonly detalhes: PacienteDuplicadoDetalhe[];

  constructor(params: PacienteDuplicadoErrorParams) {
    const porCpf = params.detalhes.find((item) => item.motivo === 'cpf');
    super({
      message: porCpf
        ? `Já existe um paciente cadastrado com o CPF ${porCpf.cpf}: ${porCpf.nome}`
        : `Já existe um paciente com o mesmo nome e data de nascimento: ${params.detalhes[0]?.nome ?? ''}`,
      code: 'PACIENTE_DUPLICADO',
    });
    this.name = 'PacienteDuplicadoError';
    this.detalhes = params.detalhes;
  }
}

export type ResponsavelObrigatorioErrorParams = { reason: string };

export class ResponsavelObrigatorioError extends ValidationError {
  constructor(params: ResponsavelObrigatorioErrorParams) {
    super({ message: params.reason, code: 'RESPONSAVEL_OBRIGATORIO' });
    this.name = 'ResponsavelObrigatorioError';
  }
}

export type InvalidPatientOperationErrorParams = { reason: string };

export class InvalidPatientOperationError extends ValidationError {
  constructor(params: InvalidPatientOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_PATIENT_OPERATION' });
    this.name = 'InvalidPatientOperationError';
  }
}
