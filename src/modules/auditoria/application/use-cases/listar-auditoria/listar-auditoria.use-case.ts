import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { buildPaginatedResult, normalizePagination } from '@core/application/pagination';
import type { PaginatedResult } from '@core/application/pagination';
import type { IAuditoriaRepository } from '../../../domain/repositories/auditoria-repository.interface';
import { AuditoriaMapper } from '../../mappers/auditoria.mapper';
import type { RegistroAuditoriaOutputDto } from '../../mappers/auditoria.output.dto';
import type { ListarAuditoriaInputDto } from './listar-auditoria.input.dto';

export type ListarAuditoriaDependencies = {
  auditoriaRepository: IAuditoriaRepository;
  mapper: AuditoriaMapper;
};

export class ListarAuditoriaUseCase extends UseCase<
  ListarAuditoriaInputDto,
  PaginatedResult<RegistroAuditoriaOutputDto>
> {
  private readonly auditoriaRepository: IAuditoriaRepository;
  private readonly mapper: AuditoriaMapper;

  constructor(dependencies: ListarAuditoriaDependencies) {
    super();
    this.auditoriaRepository = dependencies.auditoriaRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: ListarAuditoriaInputDto,
  ): Promise<Result<PaginatedResult<RegistroAuditoriaOutputDto>>> {
    const paginacao = normalizePagination({ page: input.pagina, perPage: input.porPagina });
    const filtros = {
      redeId: input.redeId,
      usuarioId: input.usuarioId ?? null,
      entidade: input.entidade ?? null,
      entidadeId: input.entidadeId ?? null,
      acao: input.acao ?? null,
      de: input.de ?? null,
      ate: input.ate ?? null,
    };

    const [registros, total] = await Promise.all([
      this.auditoriaRepository.listar({
        ...filtros,
        offset: paginacao.offset,
        limite: paginacao.perPage,
      }),
      this.auditoriaRepository.contar(filtros),
    ]);

    return Result.ok(
      buildPaginatedResult({
        items: registros.map((registro) => this.mapper.map({ registro })),
        total,
        pagination: paginacao,
      }),
    );
  }
}
