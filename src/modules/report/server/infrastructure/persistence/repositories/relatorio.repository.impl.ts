import type { SupabaseClient } from '@supabase/supabase-js';
import { RelatorioRepository } from '../../../../domain/repositories/relatorio-repository.base';
import type {
  FiltroRelatorioBase,
  IndicadoresDashboard,
  RelatorioAtendimentosLinha,
  RelatorioDistribuicaoLinha,
  RelatorioFaltasLinha,
  RelatorioNovosPacientesLinha,
  RelatorioProdutividadeLinha,
} from '../../../../domain/repositories/relatorio-repository.interface';

type AtendimentosRow = {
  data: string;
  unidade_id: string;
  unidade_nome: string;
  total_agendados: number;
  total_finalizados: number;
  total_cancelados: number;
  total_faltas: number;
};

type FaltasRow = {
  profissional_id: string;
  profissional_nome: string;
  especialidade: string;
  unidade_id: string;
  unidade_nome: string;
  total_agendamentos: number;
  total_faltas: number;
  total_cancelamentos: number;
  total_finalizados: number;
  taxa_faltas: number;
  taxa_cancelamentos: number;
};

type NovosPacientesRow = {
  mes: string;
  total_pacientes: number;
  com_consentimento_lgpd: number;
  total_inativos: number;
};

type DistribuicaoRow = { dimensao: string; rotulo: string; cor: string; total: number };

type ProdutividadeRow = {
  profissional_id: string;
  profissional_nome: string;
  especialidade: string;
  unidade_id: string;
  unidade_nome: string;
  total_atendimentos: number;
  dias_com_atendimento: number;
  media_atendimentos_dia: number;
  total_evolucoes: number;
};

type IndicadoresRow = {
  consultas_hoje: number;
  pacientes_aguardando: number;
  em_atendimento: number;
  pacientes_ativos: number;
  profissionais_ativos: number;
  taxa_faltas_30d: number;
  gerado_em: string;
};

export type RelatorioRepositoryDependencies = {
  supabase: SupabaseClient;
};

export class RelatorioRepositoryImpl extends RelatorioRepository {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: RelatorioRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
  }

  async atendimentosPorPeriodo(
    filtro: FiltroRelatorioBase & { profissionalId?: string | null },
  ): Promise<RelatorioAtendimentosLinha[]> {
    const { data, error } = await this.supabase.rpc('relatorio_atendimentos', {
      p_inicio: filtro.periodo.inicio,
      p_fim: filtro.periodo.fim,
      p_unidade_id: filtro.unidadeId ?? null,
      p_profissional_id: filtro.profissionalId ?? null,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as AtendimentosRow[]).map((linha) => ({
      data: String(linha.data).slice(0, 10),
      unidadeId: linha.unidade_id,
      unidadeNome: linha.unidade_nome,
      totalAgendados: Number(linha.total_agendados),
      totalFinalizados: Number(linha.total_finalizados),
      totalCancelados: Number(linha.total_cancelados),
      totalFaltas: Number(linha.total_faltas),
    }));
  }

  async faltasCancelamentos(filtro: FiltroRelatorioBase): Promise<RelatorioFaltasLinha[]> {
    const { data, error } = await this.supabase.rpc('relatorio_faltas_cancelamentos', {
      p_inicio: filtro.periodo.inicio,
      p_fim: filtro.periodo.fim,
      p_unidade_id: filtro.unidadeId ?? null,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as FaltasRow[]).map((linha) => ({
      profissionalId: linha.profissional_id,
      profissionalNome: linha.profissional_nome,
      especialidade: linha.especialidade,
      unidadeId: linha.unidade_id,
      unidadeNome: linha.unidade_nome,
      totalAgendamentos: Number(linha.total_agendamentos),
      totalFaltas: Number(linha.total_faltas),
      totalCancelamentos: Number(linha.total_cancelamentos),
      totalFinalizados: Number(linha.total_finalizados),
      taxaFaltas: Number(linha.taxa_faltas),
      taxaCancelamentos: Number(linha.taxa_cancelamentos),
    }));
  }

  async novosPacientesPorMes(
    filtro: Omit<FiltroRelatorioBase, 'unidadeId'>,
  ): Promise<RelatorioNovosPacientesLinha[]> {
    const { data, error } = await this.supabase.rpc('relatorio_novos_pacientes', {
      p_inicio: filtro.periodo.inicio,
      p_fim: filtro.periodo.fim,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as NovosPacientesRow[]).map((linha) => ({
      mes: String(linha.mes).slice(0, 10),
      totalPacientes: Number(linha.total_pacientes),
      comConsentimentoLgpd: Number(linha.com_consentimento_lgpd),
      totalInativos: Number(linha.total_inativos),
    }));
  }

  async distribuicao(
    filtro: FiltroRelatorioBase & { dimensao?: 'tipo' | 'especialidade' | null },
  ): Promise<RelatorioDistribuicaoLinha[]> {
    const { data, error } = await this.supabase.rpc('relatorio_distribuicao', {
      p_inicio: filtro.periodo.inicio,
      p_fim: filtro.periodo.fim,
      p_unidade_id: filtro.unidadeId ?? null,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as DistribuicaoRow[])
      .map((linha) => ({
        dimensao: (linha.dimensao === 'especialidade' ? 'especialidade' : 'tipo') as
          | 'tipo'
          | 'especialidade',
        rotulo: linha.rotulo,
        cor: linha.cor,
        total: Number(linha.total),
      }))
      .filter((linha) => !filtro.dimensao || linha.dimensao === filtro.dimensao);
  }

  async produtividade(filtro: FiltroRelatorioBase): Promise<RelatorioProdutividadeLinha[]> {
    const { data, error } = await this.supabase.rpc('relatorio_produtividade', {
      p_inicio: filtro.periodo.inicio,
      p_fim: filtro.periodo.fim,
      p_unidade_id: filtro.unidadeId ?? null,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as ProdutividadeRow[]).map((linha) => ({
      profissionalId: linha.profissional_id,
      profissionalNome: linha.profissional_nome,
      especialidade: linha.especialidade,
      unidadeId: linha.unidade_id,
      unidadeNome: linha.unidade_nome,
      totalAtendimentos: Number(linha.total_atendimentos),
      diasComAtendimento: Number(linha.dias_com_atendimento),
      mediaAtendimentosDia: Number(linha.media_atendimentos_dia),
      totalEvolucoes: Number(linha.total_evolucoes),
    }));
  }

  async indicadoresDashboard(params: { unidadeId?: string | null }): Promise<IndicadoresDashboard> {
    const { data, error } = await this.supabase.rpc('indicadores_dashboard', {
      p_unidade_id: params.unidadeId ?? null,
    });

    if (error) throw new Error(error.message);

    const indicadores = (data ?? {}) as IndicadoresRow;

    return {
      consultasHoje: Number(indicadores.consultas_hoje ?? 0),
      pacientesAguardando: Number(indicadores.pacientes_aguardando ?? 0),
      emAtendimento: Number(indicadores.em_atendimento ?? 0),
      pacientesAtivos: Number(indicadores.pacientes_ativos ?? 0),
      profissionaisAtivos: Number(indicadores.profissionais_ativos ?? 0),
      taxaFaltas30d: Number(indicadores.taxa_faltas_30d ?? 0),
      geradoEm: String(indicadores.gerado_em ?? new Date().toISOString()),
    };
  }
}
