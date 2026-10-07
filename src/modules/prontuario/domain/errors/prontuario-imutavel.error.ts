import { DomainError } from '@core/domain/errors/domain-error.base';

export type ProntuarioImutavelErrorParams = { atendimentoId: string };

export class ProntuarioImutavelError extends DomainError {
  constructor(params: ProntuarioImutavelErrorParams) {
    super({
      message: `O atendimento "${params.atendimentoId}" já foi finalizado. Registre um adendo para complementar.`,
      code: 'PRONTUARIO_IMUTAVEL',
    });
    this.name = 'ProntuarioImutavelError';
  }
}
