export type PeriodoRelatorio = {
  inicio: string;
  fim: string;
};

export type FiltroRelatorioBase = {
  redeId: string;
  periodo: PeriodoRelatorio;
  unidadeId?: string | null;
};

export type RelatorioAtendimentosLinha = {
  data: string;
  unidadeId: string;
  unidadeNome: string;
  totalAgendados: number;
  totalFinalizados: number;
  totalCancelados: number;
  totalFaltas: number;
};

export type RelatorioFaltasLinha = {
  profissionalId: string;
  profissionalNome: string;
  especialidade: string;
  unidadeId: string;
  unidadeNome: string;
  totalAgendamentos: number;
  totalFaltas: number;
  totalCancelamentos: number;
  totalFinalizados: number;
  taxaFaltas: number;
  taxaCancelamentos: number;
};

export type RelatorioNovosPacientesLinha = {
  mes: string;
  totalPacientes: number;
  comConsentimentoLgpd: number;
  totalInativos: number;
};

export type RelatorioDistribuicaoLinha = {
  dimensao: 'tipo' | 'especialidade';
  rotulo: string;
  cor: string;
  total: number;
};

export type RelatorioProdutividadeLinha = {
  profissionalId: string;
  profissionalNome: string;
  especialidade: string;
  unidadeId: string;
  unidadeNome: string;
  totalAtendimentos: number;
  diasComAtendimento: number;
  mediaAtendimentosDia: number;
  totalEvolucoes: number;
};

export type IndicadoresDashboard = {
  consultasHoje: number;
  pacientesAguardando: number;
  emAtendimento: number;
  pacientesAtivos: number;
  profissionaisAtivos: number;
  taxaFaltas30d: number;
  geradoEm: string;
};

/**
 * Relatórios são calculados no banco (funções `relatorio_*` e
 * `indicadores_dashboard`) — o módulo apenas orquestra filtros e formatação.
 */
export interface IRelatorioRepository {
  atendimentosPorPeriodo(
    filtro: FiltroRelatorioBase & { profissionalId?: string | null },
  ): Promise<RelatorioAtendimentosLinha[]>;
  faltasCancelamentos(filtro: FiltroRelatorioBase): Promise<RelatorioFaltasLinha[]>;
  novosPacientesPorMes(filtro: Omit<FiltroRelatorioBase, 'unidadeId'>): Promise<RelatorioNovosPacientesLinha[]>;
  distribuicao(filtro: FiltroRelatorioBase & { dimensao?: 'tipo' | 'especialidade' | null }): Promise<
    RelatorioDistribuicaoLinha[]
  >;
  produtividade(filtro: FiltroRelatorioBase): Promise<RelatorioProdutividadeLinha[]>;
  indicadoresDashboard(params: { unidadeId?: string | null }): Promise<IndicadoresDashboard>;
}

export const RELATORIO_REPOSITORY = Symbol('IRelatorioRepository');
