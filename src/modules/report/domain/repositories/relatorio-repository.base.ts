import type {
  FiltroRelatorioBase,
  IndicadoresDashboard,
  IRelatorioRepository,
  RelatorioAtendimentosLinha,
  RelatorioDistribuicaoLinha,
  RelatorioFaltasLinha,
  RelatorioNovosPacientesLinha,
  RelatorioProdutividadeLinha,
} from './relatorio-repository.interface';

export abstract class RelatorioRepository implements IRelatorioRepository {
  abstract atendimentosPorPeriodo(
    filtro: FiltroRelatorioBase & { profissionalId?: string | null },
  ): Promise<RelatorioAtendimentosLinha[]>;
  abstract faltasCancelamentos(filtro: FiltroRelatorioBase): Promise<RelatorioFaltasLinha[]>;
  abstract novosPacientesPorMes(
    filtro: Omit<FiltroRelatorioBase, 'unidadeId'>,
  ): Promise<RelatorioNovosPacientesLinha[]>;
  abstract distribuicao(
    filtro: FiltroRelatorioBase & { dimensao?: 'tipo' | 'especialidade' | null },
  ): Promise<RelatorioDistribuicaoLinha[]>;
  abstract produtividade(filtro: FiltroRelatorioBase): Promise<RelatorioProdutividadeLinha[]>;
  abstract indicadoresDashboard(params: { unidadeId?: string | null }): Promise<IndicadoresDashboard>;
}
