import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import type {
  VerificarDuplicidadePacienteInputDto,
  VerificarDuplicidadePacienteOutputDto,
} from '../../dtos/paciente.dto';

export type VerificarDuplicidadeDependencies = {
  pacienteRepository: IPacienteRepository;
};

/** Alerta preventivo na UI antes de salvar um novo paciente (§3.3). */
export class VerificarDuplicidadePacienteUseCase extends UseCase<
  VerificarDuplicidadePacienteInputDto,
  VerificarDuplicidadePacienteOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;

  constructor(dependencies: VerificarDuplicidadeDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
  }

  async execute(
    input: VerificarDuplicidadePacienteInputDto,
  ): Promise<Result<VerificarDuplicidadePacienteOutputDto>> {
    if (!input.cpf && !input.nome) {
      return Result.fail(new Error('Informe o CPF ou o nome para verificar duplicidade'));
    }

    const duplicados = await this.pacienteRepository.verificarDuplicidade({
      redeId: input.redeId,
      cpf: input.cpf ?? '',
      nome: input.nome ?? '',
      dataNascimento: input.dataNascimento ?? '',
      ignorarId: input.ignorarId ?? null,
    });

    return Result.ok({ duplicados });
  }
}
