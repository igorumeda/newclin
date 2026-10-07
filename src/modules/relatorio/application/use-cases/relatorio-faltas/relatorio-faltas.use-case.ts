import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  IRelatorioRepository,
  ResumoFaltas,
} from '../../../domain/repositories/relatorio-repository.interface';
import type { RelatorioFaltasInputDto } from './relatorio-faltas.input.dto';

export type RelatorioFaltasDependencies = { relatorioRepository: IRelatorioRepository };

export class RelatorioFaltasUseCase extends UseCase<RelatorioFaltasInputDto, ResumoFaltas> {
  private readonly relatorioRepository: IRelatorioRepository;

  constructor(dependencies: RelatorioFaltasDependencies) {
    super();
    this.relatorioRepository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioFaltasInputDto): Promise<Result<ResumoFaltas>> {
    const resumo = await this.relatorioRepository.resumoFaltas({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: input.profissionalId ?? null,
      inicio: input.inicio,
      fim: input.fim,
    });
    return Result.ok(resumo);
  }
}
