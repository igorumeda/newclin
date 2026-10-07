import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  IRelatorioRepository,
  ProdutividadeItem,
} from '../../../domain/repositories/relatorio-repository.interface';
import type { RelatorioProdutividadeInputDto } from './relatorio-produtividade.input.dto';

export type RelatorioProdutividadeDependencies = { relatorioRepository: IRelatorioRepository };

export class RelatorioProdutividadeUseCase extends UseCase<
  RelatorioProdutividadeInputDto,
  ProdutividadeItem[]
> {
  private readonly relatorioRepository: IRelatorioRepository;

  constructor(dependencies: RelatorioProdutividadeDependencies) {
    super();
    this.relatorioRepository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioProdutividadeInputDto): Promise<Result<ProdutividadeItem[]>> {
    const itens = await this.relatorioRepository.produtividade({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: null,
      inicio: input.inicio,
      fim: input.fim,
    });
    return Result.ok(itens);
  }
}
