import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNotFoundError } from '../../../domain/errors/paciente.errors';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import type {
  ExportarDadosPacienteInputDto,
  ExportarDadosPacienteOutputDto,
} from '../../dtos/paciente.dto';

export type ExportarDadosPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
};

/** Exportação dos dados do titular em formato legível (LGPD, §5). */
export class ExportarDadosPacienteUseCase extends UseCase<
  ExportarDadosPacienteInputDto,
  ExportarDadosPacienteOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;

  constructor(dependencies: ExportarDadosPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
  }

  async execute(
    input: ExportarDadosPacienteInputDto,
  ): Promise<Result<ExportarDadosPacienteOutputDto>> {
    const paciente = await this.pacienteRepository.findById(input.pacienteId);
    if (!paciente) return Result.fail(new PacienteNotFoundError({ pacienteId: input.pacienteId }));

    const dados = await this.pacienteRepository.exportarDados(input.pacienteId);

    return Result.ok({
      pacienteId: input.pacienteId,
      geradoEm: new Date().toISOString(),
      dados: dados ?? {},
    });
  }
}
