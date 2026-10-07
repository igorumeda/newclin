import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNaoEncontradoError } from '../../../domain/errors/paciente-nao-encontrado.error';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { PacienteOutputDto } from '../../mappers/paciente.output.dto';
import type { AlternarStatusPacienteInputDto } from './alternar-status-paciente.input.dto';

export type AlternarStatusPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export class AlternarStatusPacienteUseCase extends UseCase<
  AlternarStatusPacienteInputDto,
  PacienteOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: AlternarStatusPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AlternarStatusPacienteInputDto): Promise<Result<PacienteOutputDto>> {
    const paciente = await this.pacienteRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!paciente) return Result.fail(new PacienteNaoEncontradoError({ pacienteId: input.id }));

    const resultado = input.ativo ? paciente.reativar() : paciente.inativar();
    if (resultado.isFailure) return Result.propagate(resultado);

    await this.pacienteRepository.atualizar(paciente);
    return Result.ok(this.mapper.map({ paciente }));
  }
}
