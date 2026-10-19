import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNotFoundError } from '../../../domain/errors/paciente.errors';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { InativarPacienteInputDto, InativarPacienteOutputDto } from '../../dtos/paciente.dto';

export type InativarPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

/** Soft delete (§5): pacientes nunca são excluídos fisicamente. */
export class InativarPacienteUseCase extends UseCase<InativarPacienteInputDto, InativarPacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: InativarPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: InativarPacienteInputDto): Promise<Result<InativarPacienteOutputDto>> {
    const paciente = await this.pacienteRepository.findById(input.pacienteId);
    if (!paciente) return Result.fail(new PacienteNotFoundError({ pacienteId: input.pacienteId }));

    const result = input.reativar ? paciente.reativar() : paciente.inativar();
    if (result.isFailure) return Result.fail(result.error);

    await this.pacienteRepository.update(paciente);

    return Result.ok(this.mapper.map({ paciente }));
  }
}
