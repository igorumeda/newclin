import type {
  IndicadoresDashboard,
  RelatorioAtendimentosLinha,
  RelatorioDistribuicaoLinha,
  RelatorioFaltasLinha,
  RelatorioNovosPacientesLinha,
  RelatorioProdutividadeLinha,
} from '../../domain/repositories/relatorio-repository.interface';

export type DashboardDto = IndicadoresDashboard;

export type RelatorioFiltroInputDto = {
  redeId: string;
  inicio: string;
  fim: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
};

export type RelatorioAtendimentosOutputDto = {
  linhas: RelatorioAtendimentosLinha[];
  totais: {
    agendados: number;
    finalizados: number;
    cancelados: number;
    faltas: number;
  };
};

export type RelatorioFaltasOutputDto = {
  linhas: RelatorioFaltasLinha[];
  totais: { agendamentos: number; faltas: number; cancelamentos: number; taxaFaltas: number };
};

export type RelatorioNovosPacientesOutputDto = {
  linhas: RelatorioNovosPacientesLinha[];
  totalPacientes: number;
};

export type RelatorioDistribuicaoOutputDto = {
  linhas: RelatorioDistribuicaoLinha[];
  dimensao: 'tipo' | 'especialidade';
};

export type RelatorioProdutividadeOutputDto = {
  linhas: RelatorioProdutividadeLinha[];
  totalAtendimentos: number;
};

export type RelatorioVisaoGeralOutputDto = {
  periodo: { inicio: string; fim: string };
  dashboard: DashboardDto;
  atendimentos: RelatorioAtendimentosOutputDto;
  faltas: RelatorioFaltasOutputDto;
  novosPacientes: RelatorioNovosPacientesOutputDto;
  distribuicao: { tipo: RelatorioDistribuicaoLinha[]; especialidade: RelatorioDistribuicaoLinha[] };
  produtividade: RelatorioProdutividadeOutputDto;
};
