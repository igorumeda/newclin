import type {
  DashboardDto,
  RelatorioAtendimentosOutputDto,
  RelatorioDistribuicaoOutputDto,
  RelatorioFaltasOutputDto,
  RelatorioNovosPacientesOutputDto,
  RelatorioProdutividadeOutputDto,
  RelatorioVisaoGeralOutputDto,
} from '@/modules/report/application/dtos/relatorio.dto';
import { api } from './api-client.service';

export type {
  DashboardDto,
  RelatorioAtendimentosOutputDto,
  RelatorioDistribuicaoOutputDto,
  RelatorioFaltasOutputDto,
  RelatorioNovosPacientesOutputDto,
  RelatorioProdutividadeOutputDto,
  RelatorioVisaoGeralOutputDto,
};

export type PeriodoParams = { inicio?: string; fim?: string; unidadeId?: string };

export const relatorioService = {
  async dashboard(params: { unidadeId?: string } = {}): Promise<DashboardDto> {
    return api.get<DashboardDto>('/api/relatorios/dashboard', { query: params });
  },

  async visaoGeral(params: PeriodoParams): Promise<RelatorioVisaoGeralOutputDto> {
    return api.get<RelatorioVisaoGeralOutputDto>('/api/relatorios/visao-geral', { query: params });
  },

  async atendimentos(params: PeriodoParams): Promise<RelatorioAtendimentosOutputDto> {
    return api.get<RelatorioAtendimentosOutputDto>('/api/relatorios/atendimentos', { query: params });
  },

  async faltas(params: PeriodoParams): Promise<RelatorioFaltasOutputDto> {
    return api.get<RelatorioFaltasOutputDto>('/api/relatorios/faltas', { query: params });
  },

  async novosPacientes(params: PeriodoParams): Promise<RelatorioNovosPacientesOutputDto> {
    return api.get<RelatorioNovosPacientesOutputDto>('/api/relatorios/novos-pacientes', { query: params });
  },

  async distribuicao(
    params: PeriodoParams & { dimensao?: 'tipo' | 'especialidade' },
  ): Promise<RelatorioDistribuicaoOutputDto> {
    return api.get<RelatorioDistribuicaoOutputDto>('/api/relatorios/distribuicao', { query: params });
  },

  async produtividade(params: PeriodoParams): Promise<RelatorioProdutividadeOutputDto> {
    return api.get<RelatorioProdutividadeOutputDto>('/api/relatorios/produtividade', { query: params });
  },
};
