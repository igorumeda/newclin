import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { UnidadeResponseDto } from '../dtos/unidade.response.dto';
import type { CriarEnderecoParams } from '../../domain/value-objects/endereco.vo';

export type ListarUnidadesParams = { busca?: string; apenasAtivas?: boolean };
export type SalvarUnidadeParams = {
  nome: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: CriarEnderecoParams;
  fusoHorario?: string;
};
export type AtualizarUnidadeParams = { id: string; dados: Partial<SalvarUnidadeParams> };
export type DesativarUnidadeParams = { id: string };

export class UnidadeApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listar(params: ListarUnidadesParams = {}): Promise<UnidadeResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<UnidadeResponseDto[]>>({
      path: '/api/v1/unidades',
      params: { busca: params.busca, apenasAtivas: params.apenasAtivas },
    });
    return resposta.data;
  }

  async criar(params: SalvarUnidadeParams): Promise<UnidadeResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<UnidadeResponseDto>,
      SalvarUnidadeParams
    >({ path: '/api/v1/unidades', body: params });
    return resposta.data;
  }

  async atualizar({ id, dados }: AtualizarUnidadeParams): Promise<UnidadeResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<UnidadeResponseDto>,
      Partial<SalvarUnidadeParams>
    >({ path: `/api/v1/unidades/${id}`, body: dados });
    return resposta.data;
  }

  async desativar({ id }: DesativarUnidadeParams): Promise<void> {
    await this.httpClient.delete<ApiSuccessResponse<unknown>>({ path: `/api/v1/unidades/${id}` });
  }
}

export const unidadeApiService = new UnidadeApiService({ httpClient });
