export type PeriodoRelatorioParams = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  inicio: string;
  fim: string;
};

export type SerieTemporalPonto = { chave: string; rotulo: string; total: number };
export type DistribuicaoItem = { rotulo: string; total: number; percentual: number };
export type ProdutividadeItem = {
  profissionalId: string;
  profissionalNome: string;
  especialidade: string;
  agendados: number;
  finalizados: number;
  faltas: number;
  cancelados: number;
  taxaComparecimento: number;
};
export type ResumoFaltas = {
  total: number;
  faltas: number;
  cancelados: number;
  taxaFaltas: number;
  taxaCancelamentos: number;
  porMotivo: DistribuicaoItem[];
};
export type IndicadoresDashboard = {
  atendimentosHoje: number;
  aguardando: number;
  emAtendimento: number;
  finalizadosHoje: number;
  pacientesAtivos: number;
  proximosSete: number;
  taxaOcupacao: number;
};

export type IndicadoresParams = { redeId: string; unidadeId?: string | null; referencia: string };

export interface IRelatorioRepository {
  atendimentosPorPeriodo(params: PeriodoRelatorioParams): Promise<SerieTemporalPonto[]>;
  resumoFaltas(params: PeriodoRelatorioParams): Promise<ResumoFaltas>;
  novosPacientesPorMes(params: PeriodoRelatorioParams): Promise<SerieTemporalPonto[]>;
  distribuicaoPorTipo(params: PeriodoRelatorioParams): Promise<DistribuicaoItem[]>;
  distribuicaoPorEspecialidade(params: PeriodoRelatorioParams): Promise<DistribuicaoItem[]>;
  produtividade(params: PeriodoRelatorioParams): Promise<ProdutividadeItem[]>;
  indicadores(params: IndicadoresParams): Promise<IndicadoresDashboard>;
}

export const RELATORIO_REPOSITORY = Symbol('IRelatorioRepository');
