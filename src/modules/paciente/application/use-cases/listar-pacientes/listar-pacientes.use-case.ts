import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { buildPaginatedResult, normalizePagination } from '@core/application/pagination';
import type { PaginatedResult } from '@core/application/pagination';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { PacienteOutputDto } from '../../mappers/paciente.output.dto';
import type { ListarPacientesInputDto } from './listar-pacientes.input.dto';

export type ListarPacientesDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};
export type ListarPacientesOutputDto = PaginatedResult<PacienteOutputDto>;

export class ListarPacientesUseCase extends UseCase<
  ListarPacientesInputDto,
  ListarPacientesOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: ListarPacientesDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarPacientesInputDto): Promise<Result<ListarPacientesOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const [pacientes, total] = await Promise.all([
      this.pacienteRepository.listar({
        redeId: input.redeId,
        busca: input.busca,
        apenasAtivos: input.apenasAtivos,
        offset: pagination.offset,
        limite: pagination.perPage,
      }),
      this.pacienteRepository.contar({
        redeId: input.redeId,
        busca: input.busca,
        apenasAtivos: input.apenasAtivos,
      }),
    ]);

    return Result.ok(
      buildPaginatedResult({
        items: pacientes.map((paciente) => this.mapper.map({ paciente })),
        total,
        pagination,
      }),
    );
  }
}
