import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNotFoundError } from '../../../domain/errors/paciente.errors';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { ObterPacienteInputDto, ObterPacienteOutputDto } from '../../dtos/paciente.dto';

export type ObterPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export class ObterPacienteUseCase extends UseCase<ObterPacienteInputDto, ObterPacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: ObterPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterPacienteInputDto): Promise<Result<ObterPacienteOutputDto>> {
    const paciente = await this.pacienteRepository.findById(input.pacienteId);
    if (!paciente) return Result.fail(new PacienteNotFoundError({ pacienteId: input.pacienteId }));

    return Result.ok(this.mapper.map({ paciente }));
  }
}
