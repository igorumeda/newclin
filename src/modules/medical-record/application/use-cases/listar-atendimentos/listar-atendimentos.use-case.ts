import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { normalizePagination } from '@core/application/pagination/pagination';
import type { IAtendimentoRepository } from '../../../domain/repositories/prontuario-repositories.interface';
import type { AtendimentoMapper, EnriquecimentoAtendimento } from '../../mappers/prontuario.mapper';
import type { Atendimento } from '../../../domain/entities/atendimento.entity';
import type {
  ListarAtendimentosInputDto,
  ListarAtendimentosOutputDto,
} from '../../dtos/prontuario.dto';

export type ListarAtendimentosDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  mapper: AtendimentoMapper;
  enricher?: {
    enriquecer: (params: { atendimentos: Atendimento[] }) => Promise<Map<string, EnriquecimentoAtendimento>>;
  };
};

/** Histórico de atendimentos por paciente, profissional, unidade e período. */
export class ListarAtendimentosUseCase extends UseCase<
  ListarAtendimentosInputDto,
  ListarAtendimentosOutputDto
> {
  private readonly repository: IAtendimentoRepository;
  private readonly mapper: AtendimentoMapper;
  private readonly enricher?: ListarAtendimentosDependencies['enricher'];

  constructor(dependencies: ListarAtendimentosDependencies) {
    super();
    this.repository = dependencies.atendimentoRepository;
    this.mapper = dependencies.mapper;
    this.enricher = dependencies.enricher;
  }

  async execute(input: ListarAtendimentosInputDto): Promise<Result<ListarAtendimentosOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const { items, total } = await this.repository.listar({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      pacienteId: input.pacienteId ?? null,
      profissionalId: input.profissionalId ?? null,
      de: input.de ?? null,
      ate: input.ate ?? null,
      status: input.status ?? null,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    const enriquecimento = this.enricher
      ? await this.enricher.enriquecer({ atendimentos: items })
      : new Map<string, EnriquecimentoAtendimento>();

    return Result.ok({
      items: items.map((atendimento) =>
        this.mapper.map({ atendimento, enriquecimento: enriquecimento.get(atendimento.id.toString()) }),
      ),
      total,
    });
  }
}
