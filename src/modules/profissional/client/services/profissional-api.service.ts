import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type {
  HorarioAtendimentoResponseDto,
  HorarioRequestDto,
  ProfissionalResponseDto,
} from '../dtos/profissional.response.dto';

export type ListarProfissionaisParams = {
  busca?: string;
  unidadeId?: string | null;
  apenasAtivos?: boolean;
};
export type SalvarProfissionalParams = {
  nome: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  conselho: string;
  numeroConselho: string;
  ufConselho?: string | null;
  especialidade: string;
  corAgenda?: string;
  unidades?: string[];
};
export type AtualizarProfissionalParams = { id: string; dados: Partial<SalvarProfissionalParams> };
export type DefinirHorariosParams = { id: string; horarios: HorarioRequestDto[] };
export type DesativarProfissionalParams = { id: string };

export class ProfissionalApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listar(params: ListarProfissionaisParams = {}): Promise<ProfissionalResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<ProfissionalResponseDto[]>>({
      path: '/api/v1/profissionais',
      params: {
        busca: params.busca,
        unidadeId: params.unidadeId ?? undefined,
        apenasAtivos: params.apenasAtivos,
      },
    });
    return resposta.data;
  }

  async criar(params: SalvarProfissionalParams): Promise<ProfissionalResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<ProfissionalResponseDto>,
      SalvarProfissionalParams
    >({ path: '/api/v1/profissionais', body: params });
    return resposta.data;
  }

  async atualizar({ id, dados }: AtualizarProfissionalParams): Promise<ProfissionalResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<ProfissionalResponseDto>,
      Partial<SalvarProfissionalParams>
    >({ path: `/api/v1/profissionais/${id}`, body: dados });
    return resposta.data;
  }

  async definirHorarios({
    id,
    horarios,
  }: DefinirHorariosParams): Promise<HorarioAtendimentoResponseDto[]> {
    const resposta = await this.httpClient.put<
      ApiSuccessResponse<HorarioAtendimentoResponseDto[]>,
      { horarios: HorarioRequestDto[] }
    >({ path: `/api/v1/profissionais/${id}/horarios`, body: { horarios } });
    return resposta.data;
  }

  async desativar({ id }: DesativarProfissionalParams): Promise<void> {
    await this.httpClient.delete<ApiSuccessResponse<unknown>>({
      path: `/api/v1/profissionais/${id}`,
    });
  }
}

export const profissionalApiService = new ProfissionalApiService({ httpClient });
