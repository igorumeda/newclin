import { DomainService } from '@core/domain/domain-service.base';
import { Result } from '@core/domain/result';
import type { Paciente } from '../entities/paciente.entity';
import type { Cpf } from '../value-objects/cpf.vo';
import type { DataNascimento } from '../value-objects/data-nascimento.vo';
import { PacienteDuplicadoError } from '../errors/paciente-duplicado.error';

export type DuplicidadeParams = {
  cpf: Cpf;
  nome: string;
  dataNascimento: DataNascimento;
  porCpf: Paciente | null;
  porNomeENascimento: Paciente | null;
};
export type DuplicidadeResultado = { duplicado: false } | { duplicado: true; pacienteId: string };

/**
 * Regra de detecção de duplicidade (spec §3.3): CPF é o critério primário;
 * nome + data de nascimento é o fallback.
 */
export class DetectorDuplicidadeService extends DomainService<
  DuplicidadeParams,
  DuplicidadeResultado
> {
  public execute(params: DuplicidadeParams): Result<DuplicidadeResultado> {
    if (params.porCpf) {
      return Result.fail(
        new PacienteDuplicadoError({ criterio: 'cpf', valor: params.cpf.formatado }),
      );
    }
    if (params.porNomeENascimento) {
      return Result.fail(
        new PacienteDuplicadoError({
          criterio: 'nome_nascimento',
          valor: `${params.nome} — ${params.dataNascimento.iso}`,
        }),
      );
    }
    return Result.ok({ duplicado: false });
  }
}
