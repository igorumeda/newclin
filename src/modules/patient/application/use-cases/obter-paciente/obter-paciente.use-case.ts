import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNotFoundError } from '../../../domain/errors/paciente.errors';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { RegistrarAcessoProntuario } from '@/modules/audit/domain/services/log-acesso-prontuario.interface';
import type { ObterPacienteInputDto, ObterPacienteOutputDto } from '../../dtos/paciente.dto';

export type ObterPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
  /** Log de leitura de dados do paciente — LGPD (§5). */
  registrarAcesso?: RegistrarAcessoProntuario;
};

export class ObterPacienteUseCase extends UseCase<ObterPacienteInputDto, ObterPacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;
  private readonly registrarAcesso?: RegistrarAcessoProntuario;

  constructor(dependencies: ObterPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
    this.registrarAcesso = dependencies.registrarAcesso;
  }

  async execute(input: ObterPacienteInputDto): Promise<Result<ObterPacienteOutputDto>> {
    const paciente = await this.pacienteRepository.findById(input.pacienteId);
    if (!paciente) return Result.fail(new PacienteNotFoundError({ pacienteId: input.pacienteId }));

    // LGPD (§5): a leitura dos dados do titular é registrada na trilha de auditoria.
    await this.registrarAcesso?.({
      pacienteId: paciente.id.toString(),
      atendimentoId: null,
      unidadeId: null,
    });

    return Result.ok(this.mapper.map({ paciente }));
  }
}
