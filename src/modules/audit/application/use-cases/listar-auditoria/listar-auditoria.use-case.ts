import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { buildPaginationMeta, normalizePagination } from '@core/application/pagination/pagination';
import type { IAuditoriaRepository } from '../../../domain/repositories/auditoria-repository.interface';
import { AuditoriaMapper } from '../../mappers/auditoria.mapper';
import type { ListarAuditoriaInputDto } from './listar-auditoria.input.dto';
import type { ListarAuditoriaOutputDto } from './listar-auditoria.output.dto';

export type ListarAuditoriaDependencies = {
  auditoriaRepository: IAuditoriaRepository;
  mapper: AuditoriaMapper;
};

export class ListarAuditoriaUseCase extends UseCase<ListarAuditoriaInputDto, ListarAuditoriaOutputDto> {
  private readonly auditoriaRepository: IAuditoriaRepository;
  private readonly mapper: AuditoriaMapper;

  constructor(dependencies: ListarAuditoriaDependencies) {
    super();
    this.auditoriaRepository = dependencies.auditoriaRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarAuditoriaInputDto): Promise<Result<ListarAuditoriaOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const { items, total } = await this.auditoriaRepository.listar({
      ...input,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    return Result.ok({
      items: items.map((auditoria) => this.mapper.map({ auditoria })),
      meta: buildPaginationMeta({ pagination, total }),
    });
  }
}
