import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  IndicadoresDashboard,
  IRelatorioRepository,
} from '../../../domain/repositories/relatorio-repository.interface';
import type { ObterIndicadoresInputDto } from './obter-indicadores.input.dto';

export type ObterIndicadoresDependencies = { relatorioRepository: IRelatorioRepository };

export class ObterIndicadoresUseCase extends UseCase<
  ObterIndicadoresInputDto,
  IndicadoresDashboard
> {
  private readonly relatorioRepository: IRelatorioRepository;

  constructor(dependencies: ObterIndicadoresDependencies) {
    super();
    this.relatorioRepository = dependencies.relatorioRepository;
  }

  async execute(input: ObterIndicadoresInputDto): Promise<Result<IndicadoresDashboard>> {
    const indicadores = await this.relatorioRepository.indicadores({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      referencia: input.referencia ?? new Date().toISOString(),
    });
    return Result.ok(indicadores);
  }
}
