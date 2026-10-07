import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNaoEncontradoError } from '../../../domain/errors/paciente-nao-encontrado.error';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { PacienteOutputDto } from '../../mappers/paciente.output.dto';
import type { ExportarPacienteInputDto } from './exportar-paciente.input.dto';

export type ExportarPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export type ExportarPacienteOutputDto = {
  geradoEm: string;
  formato: 'json';
  paciente: PacienteOutputDto;
};

/** Exportação de dados pessoais em formato legível (LGPD — spec §5). */
export class ExportarPacienteUseCase extends UseCase<
  ExportarPacienteInputDto,
  ExportarPacienteOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: ExportarPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ExportarPacienteInputDto): Promise<Result<ExportarPacienteOutputDto>> {
    const paciente = await this.pacienteRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!paciente) return Result.fail(new PacienteNaoEncontradoError({ pacienteId: input.id }));

    return Result.ok({
      geradoEm: new Date().toISOString(),
      formato: 'json',
      paciente: this.mapper.map({ paciente }),
    });
  }
}
