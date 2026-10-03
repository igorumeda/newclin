import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { normalizePagination } from '@core/application/pagination/pagination';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { ListarPacientesInputDto, ListarPacientesOutputDto } from '../../dtos/paciente.dto';

export type ListarPacientesDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

/** Busca por nome (parcial, case/acento-insensível) ou CPF exato (§3.3). */
export class ListarPacientesUseCase extends UseCase<ListarPacientesInputDto, ListarPacientesOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: ListarPacientesDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarPacientesInputDto): Promise<Result<ListarPacientesOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const { items, total } = await this.pacienteRepository.buscar({
      redeId: input.redeId,
      termo: input.termo ?? null,
      somenteAtivos: input.somenteAtivos ?? true,
      unidadeId: input.unidadeId ?? null,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    return Result.ok({
      items: items.map((paciente) => this.mapper.map({ paciente })),
      total,
      page: pagination.page,
      perPage: pagination.perPage,
    });
  }
}
