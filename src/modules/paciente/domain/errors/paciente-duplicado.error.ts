import { ConflictError } from '@core/domain/errors/conflict.error';

export type PacienteDuplicadoErrorParams = { criterio: 'cpf' | 'nome_nascimento'; valor: string };

export class PacienteDuplicadoError extends ConflictError {
  public readonly criterio: string;

  constructor(params: PacienteDuplicadoErrorParams) {
    super({
      message:
        params.criterio === 'cpf'
          ? `Já existe um paciente cadastrado com o CPF ${params.valor}`
          : `Já existe um paciente com o mesmo nome e data de nascimento (${params.valor})`,
      code: 'PACIENTE_DUPLICADO',
    });
    this.criterio = params.criterio;
    this.name = 'PacienteDuplicadoError';
  }
}
