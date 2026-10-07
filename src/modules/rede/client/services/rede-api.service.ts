import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { RedeResponseDto } from '../dtos/rede.response.dto';
import type { RedeConfig } from '../../domain/entities/rede.entity';
import type { TemaCores } from '../../domain/value-objects/tema.vo';

export type AtualizarRedeParams = {
  nome?: string;
  cnpj?: string | null;
  logotipoUrl?: string | null;
  config?: Partial<RedeConfig>;
};
export type AtualizarTemaParams = { preset?: string; cores?: Partial<TemaCores> };

export class RedeApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async obter(): Promise<RedeResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<RedeResponseDto>>({
      path: '/api/v1/rede',
    });
    return resposta.data;
  }

  async atualizar(params: AtualizarRedeParams): Promise<RedeResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<RedeResponseDto>,
      AtualizarRedeParams
    >({ path: '/api/v1/rede', body: params });
    return resposta.data;
  }

  async atualizarTema(params: AtualizarTemaParams): Promise<RedeResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<RedeResponseDto>,
      AtualizarTemaParams
    >({ path: '/api/v1/rede/tema', body: params });
    return resposta.data;
  }
}

export const redeApiService = new RedeApiService({ httpClient });
