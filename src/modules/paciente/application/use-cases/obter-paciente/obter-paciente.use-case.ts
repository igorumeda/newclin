import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNaoEncontradoError } from '../../../domain/errors/paciente-nao-encontrado.error';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { PacienteOutputDto } from '../../mappers/paciente.output.dto';
import type { ObterPacienteInputDto } from './obter-paciente.input.dto';

export type ObterPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export class ObterPacienteUseCase extends UseCase<ObterPacienteInputDto, PacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: ObterPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterPacienteInputDto): Promise<Result<PacienteOutputDto>> {
    const paciente = await this.pacienteRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!paciente) return Result.fail(new PacienteNaoEncontradoError({ pacienteId: input.id }));
    return Result.ok(this.mapper.map({ paciente }));
  }
}
