import type {
  DistribuicaoItem,
  IndicadoresDashboard,
  IndicadoresParams,
  IRelatorioRepository,
  PeriodoRelatorioParams,
  ProdutividadeItem,
  ResumoFaltas,
  SerieTemporalPonto,
} from './relatorio-repository.interface';

export abstract class RelatorioRepository implements IRelatorioRepository {
  abstract atendimentosPorPeriodo(params: PeriodoRelatorioParams): Promise<SerieTemporalPonto[]>;
  abstract resumoFaltas(params: PeriodoRelatorioParams): Promise<ResumoFaltas>;
  abstract novosPacientesPorMes(params: PeriodoRelatorioParams): Promise<SerieTemporalPonto[]>;
  abstract distribuicaoPorTipo(params: PeriodoRelatorioParams): Promise<DistribuicaoItem[]>;
  abstract distribuicaoPorEspecialidade(
    params: PeriodoRelatorioParams,
  ): Promise<DistribuicaoItem[]>;
  abstract produtividade(params: PeriodoRelatorioParams): Promise<ProdutividadeItem[]>;
  abstract indicadores(params: IndicadoresParams): Promise<IndicadoresDashboard>;
}
