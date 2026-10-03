import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/organizacao.mapper';
import type { ListarUnidadesInputDto, ListarUnidadesOutputDto } from '../../dtos/organizacao.dto';

export type ListarUnidadesDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class ListarUnidadesUseCase extends UseCase<ListarUnidadesInputDto, ListarUnidadesOutputDto> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: ListarUnidadesDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarUnidadesInputDto): Promise<Result<ListarUnidadesOutputDto>> {
    const unidades = await this.unidadeRepository.listar({
      redeId: input.redeId,
      unidadeIdsRestritas: input.unidadeIdsRestritas,
      busca: input.busca ?? null,
      ativo: input.ativo ?? null,
    });

    return Result.ok({ items: unidades.map((unidade) => this.mapper.map({ unidade })) });
  }
}
