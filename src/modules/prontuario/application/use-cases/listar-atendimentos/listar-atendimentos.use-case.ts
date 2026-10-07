import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { buildPaginatedResult, normalizePagination } from '@core/application/pagination';
import type { PaginatedResult } from '@core/application/pagination';
import type { IAtendimentoRepository } from '../../../domain/repositories/atendimento-repository.interface';
import { AtendimentoMapper } from '../../mappers/atendimento.mapper';
import type { AtendimentoOutputDto } from '../../mappers/atendimento.output.dto';
import type { ListarAtendimentosInputDto } from './listar-atendimentos.input.dto';

export type ListarAtendimentosDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  mapper: AtendimentoMapper;
};

export class ListarAtendimentosUseCase extends UseCase<
  ListarAtendimentosInputDto,
  PaginatedResult<AtendimentoOutputDto>
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly mapper: AtendimentoMapper;

  constructor(dependencies: ListarAtendimentosDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: ListarAtendimentosInputDto,
  ): Promise<Result<PaginatedResult<AtendimentoOutputDto>>> {
    const paginacao = normalizePagination({ page: input.pagina, perPage: input.porPagina });

    const [atendimentos, total] = await Promise.all([
      this.atendimentoRepository.listar({
        redeId: input.redeId,
        pacienteId: input.pacienteId ?? null,
        profissionalId: input.profissionalId ?? null,
        unidadeId: input.unidadeId ?? null,
        offset: paginacao.offset,
        limite: paginacao.perPage,
      }),
      this.atendimentoRepository.contar({
        redeId: input.redeId,
        pacienteId: input.pacienteId ?? null,
        profissionalId: input.profissionalId ?? null,
        unidadeId: input.unidadeId ?? null,
      }),
    ]);

    return Result.ok(
      buildPaginatedResult({
        items: atendimentos.map((atendimento) => this.mapper.map({ atendimento })),
        total,
        pagination: paginacao,
      }),
    );
  }
}
