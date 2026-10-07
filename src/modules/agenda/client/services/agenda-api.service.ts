import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type {
  AgendaPeriodoResponseDto,
  AgendamentoResponseDto,
  BloqueioResponseDto,
  PainelRecepcaoResponseDto,
  TipoAtendimentoResponseDto,
} from '../dtos/agenda.response.dto';

export type ListarAgendaParams = {
  inicio: string;
  fim: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  pacienteId?: string | null;
  status?: string[];
};
export type CriarAgendamentoParams = {
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string;
  inicio: string;
  duracaoMinutos?: number | null;
  encaixe?: boolean;
  observacoes?: string | null;
};
export type AlterarStatusParams = { id: string; status: string; motivo?: string | null };
export type CheckinParams = { id: string };
export type PainelParams = { unidadeId: string; data: string };
export type SalvarTipoAtendimentoParams = { nome: string; duracaoMinutos: number; cor?: string };
export type AtualizarTipoAtendimentoParams = {
  id: string;
  dados: Partial<SalvarTipoAtendimentoParams> & { ativo?: boolean };
};
export type ListarBloqueiosParams = {
  inicio: string;
  fim: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
};
export type CriarBloqueioParams = {
  unidadeId: string;
  profissionalId?: string | null;
  motivo: string;
  inicio: string;
  fim: string;
};
export type RemoverBloqueioParams = { id: string };

export class AgendaApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listarAgendamentos(params: ListarAgendaParams): Promise<AgendaPeriodoResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<AgendaPeriodoResponseDto>>({
      path: '/api/v1/agendamentos',
      params: {
        inicio: params.inicio,
        fim: params.fim,
        unidadeId: params.unidadeId ?? undefined,
        profissionalId: params.profissionalId ?? undefined,
        pacienteId: params.pacienteId ?? undefined,
        status: params.status?.join(','),
      },
    });
    return resposta.data;
  }

  async criarAgendamento(params: CriarAgendamentoParams): Promise<AgendamentoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AgendamentoResponseDto>,
      CriarAgendamentoParams
    >({ path: '/api/v1/agendamentos', body: params });
    return resposta.data;
  }

  async alterarStatus({ id, status, motivo }: AlterarStatusParams): Promise<AgendamentoResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<AgendamentoResponseDto>,
      { status: string; motivo?: string | null }
    >({ path: `/api/v1/agendamentos/${id}`, body: { status, motivo } });
    return resposta.data;
  }

  async registrarCheckin({ id }: CheckinParams): Promise<AgendamentoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AgendamentoResponseDto>,
      Record<string, never>
    >({ path: `/api/v1/agendamentos/${id}/checkin`, body: {} });
    return resposta.data;
  }

  async painelRecepcao(params: PainelParams): Promise<PainelRecepcaoResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<PainelRecepcaoResponseDto>>({
      path: '/api/v1/recepcao',
      params: { unidadeId: params.unidadeId, data: params.data },
    });
    return resposta.data;
  }

  async listarTiposAtendimento(): Promise<TipoAtendimentoResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<TipoAtendimentoResponseDto[]>>({
      path: '/api/v1/tipos-atendimento',
    });
    return resposta.data;
  }

  async criarTipoAtendimento(
    params: SalvarTipoAtendimentoParams,
  ): Promise<TipoAtendimentoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<TipoAtendimentoResponseDto>,
      SalvarTipoAtendimentoParams
    >({ path: '/api/v1/tipos-atendimento', body: params });
    return resposta.data;
  }

  async atualizarTipoAtendimento({
    id,
    dados,
  }: AtualizarTipoAtendimentoParams): Promise<TipoAtendimentoResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<TipoAtendimentoResponseDto>,
      Partial<SalvarTipoAtendimentoParams> & { ativo?: boolean }
    >({ path: `/api/v1/tipos-atendimento/${id}`, body: dados });
    return resposta.data;
  }

  async listarBloqueios(params: ListarBloqueiosParams): Promise<BloqueioResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<BloqueioResponseDto[]>>({
      path: '/api/v1/bloqueios',
      params: {
        inicio: params.inicio,
        fim: params.fim,
        unidadeId: params.unidadeId ?? undefined,
        profissionalId: params.profissionalId ?? undefined,
      },
    });
    return resposta.data;
  }

  async criarBloqueio(params: CriarBloqueioParams): Promise<BloqueioResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<BloqueioResponseDto>,
      CriarBloqueioParams
    >({ path: '/api/v1/bloqueios', body: params });
    return resposta.data;
  }

  async removerBloqueio({ id }: RemoverBloqueioParams): Promise<void> {
    await this.httpClient.delete<ApiSuccessResponse<unknown>>({ path: `/api/v1/bloqueios/${id}` });
  }
}

export const agendaApiService = new AgendaApiService({ httpClient });
