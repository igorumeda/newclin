import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Paciente } from '../../../domain/entities/paciente.entity';
import { DetectorDuplicidadeService } from '../../../domain/services/detector-duplicidade.service';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { PacienteOutputDto } from '../../mappers/paciente.output.dto';
import type { CriarPacienteInputDto } from './criar-paciente.input.dto';

export type CriarPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  detectorDuplicidade: DetectorDuplicidadeService;
  mapper: PacienteMapper;
};

export class CriarPacienteUseCase extends UseCase<CriarPacienteInputDto, PacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly detectorDuplicidade: DetectorDuplicidadeService;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: CriarPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.detectorDuplicidade = dependencies.detectorDuplicidade;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarPacienteInputDto): Promise<Result<PacienteOutputDto>> {
    const pacienteResult = Paciente.create(input);
    if (pacienteResult.isFailure) return Result.propagate(pacienteResult);

    const paciente = pacienteResult.value;

    const [porCpf, porNomeENascimento] = await Promise.all([
      this.pacienteRepository.buscarPorCpf({ redeId: input.redeId, cpf: paciente.cpf }),
      this.pacienteRepository.buscarPorNomeENascimento({
        redeId: input.redeId,
        nome: paciente.nome,
        dataNascimento: paciente.dataNascimento,
      }),
    ]);

    const duplicidade = this.detectorDuplicidade.execute({
      cpf: paciente.cpf,
      nome: paciente.nome,
      dataNascimento: paciente.dataNascimento,
      porCpf,
      porNomeENascimento,
    });
    if (duplicidade.isFailure) return Result.propagate(duplicidade);

    await this.pacienteRepository.salvar(paciente);
    return Result.ok(this.mapper.map({ paciente }));
  }
}
