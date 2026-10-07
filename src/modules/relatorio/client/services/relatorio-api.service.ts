import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type {
  IndicadoresDashboard,
  ProdutividadeItem,
  ResumoFaltas,
  SerieTemporalPonto,
} from '../../domain/repositories/relatorio-repository.interface';
import type { RelatorioAtendimentosResponseDto } from '../dtos/relatorio.response.dto';

export type IndicadoresParams = { unidadeId?: string | null; referencia?: string };
export type PeriodoParams = {
  inicio: string;
  fim: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
};

export class RelatorioApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async indicadores(params: IndicadoresParams = {}): Promise<IndicadoresDashboard> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<IndicadoresDashboard>>({
      path: '/api/v1/relatorios/indicadores',
      params: { unidadeId: params.unidadeId ?? undefined, referencia: params.referencia },
    });
    return resposta.data;
  }

  async atendimentos(params: PeriodoParams): Promise<RelatorioAtendimentosResponseDto> {
    const resposta = await this.httpClient.get<
      ApiSuccessResponse<RelatorioAtendimentosResponseDto>
    >({
      path: '/api/v1/relatorios/atendimentos',
      params: {
        inicio: params.inicio,
        fim: params.fim,
        unidadeId: params.unidadeId ?? undefined,
        profissionalId: params.profissionalId ?? undefined,
      },
    });
    return resposta.data;
  }

  async faltas(params: PeriodoParams): Promise<ResumoFaltas> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<ResumoFaltas>>({
      path: '/api/v1/relatorios/faltas',
      params: {
        inicio: params.inicio,
        fim: params.fim,
        unidadeId: params.unidadeId ?? undefined,
        profissionalId: params.profissionalId ?? undefined,
      },
    });
    return resposta.data;
  }

  async novosPacientes(params: PeriodoParams): Promise<SerieTemporalPonto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<SerieTemporalPonto[]>>({
      path: '/api/v1/relatorios/novos-pacientes',
      params: {
        inicio: params.inicio,
        fim: params.fim,
        unidadeId: params.unidadeId ?? undefined,
      },
    });
    return resposta.data;
  }

  async produtividade(params: PeriodoParams): Promise<ProdutividadeItem[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<ProdutividadeItem[]>>({
      path: '/api/v1/relatorios/produtividade',
      params: {
        inicio: params.inicio,
        fim: params.fim,
        unidadeId: params.unidadeId ?? undefined,
      },
    });
    return resposta.data;
  }
}

export const relatorioApiService = new RelatorioApiService({ httpClient });
