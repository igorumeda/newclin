import { NotFoundError } from '@core/domain/errors/not-found.error';

export type PacienteNaoEncontradoErrorParams = { pacienteId: string };

export class PacienteNaoEncontradoError extends NotFoundError {
  constructor(params: PacienteNaoEncontradoErrorParams) {
    super({
      message: `Paciente "${params.pacienteId}" não encontrado`,
      code: 'PACIENTE_NAO_ENCONTRADO',
    });
    this.name = 'PacienteNaoEncontradoError';
  }
}
