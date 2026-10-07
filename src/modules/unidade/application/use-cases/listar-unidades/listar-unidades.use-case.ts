import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/unidade.mapper';
import type { UnidadeOutputDto } from '../../mappers/unidade.output.dto';
import type { ListarUnidadesInputDto } from './listar-unidades.input.dto';

export type ListarUnidadesDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class ListarUnidadesUseCase extends UseCase<ListarUnidadesInputDto, UnidadeOutputDto[]> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: ListarUnidadesDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarUnidadesInputDto): Promise<Result<UnidadeOutputDto[]>> {
    const unidades = await this.unidadeRepository.listar({
      redeId: input.redeId,
      busca: input.busca,
      apenasAtivas: input.apenasAtivas,
    });
    const permitidas = input.unidadesPermitidas;
    const visiveis = permitidas
      ? unidades.filter((unidade) => permitidas.includes(unidade.id.toString()))
      : unidades;
    return Result.ok(visiveis.map((unidade) => this.mapper.map({ unidade })));
  }
}
