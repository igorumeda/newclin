import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type {
  AgendamentoNotificacaoResponseDto,
  NotificacaoResponseDto,
} from '../dtos/notificacao.response.dto';
import type { CanalNotificacaoValue } from '../../domain/value-objects/canal-notificacao.vo';
import type { TipoNotificacaoValue } from '../../domain/value-objects/tipo-notificacao.vo';

export type ListarNotificacoesParams = {
  canal?: CanalNotificacaoValue | null;
  status?: string | null;
  limite?: number;
};
export type AgendarNotificacaoParams = {
  agendamentoId: string;
  tipo: TipoNotificacaoValue;
  canais?: CanalNotificacaoValue[];
  agendadaPara?: string | null;
  motivo?: string | null;
  evitarDuplicidade?: boolean;
};

export class NotificacaoApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listar(params: ListarNotificacoesParams = {}): Promise<NotificacaoResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<NotificacaoResponseDto[]>>({
      path: '/api/v1/notificacoes',
      params: {
        canal: params.canal ?? undefined,
        status: params.status ?? undefined,
        limite: params.limite,
      },
    });
    return resposta.data;
  }

  async agendar(params: AgendarNotificacaoParams): Promise<AgendamentoNotificacaoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AgendamentoNotificacaoResponseDto>,
      AgendarNotificacaoParams
    >({ path: '/api/v1/notificacoes', body: params });
    return resposta.data;
  }
}

export const notificacaoApiService = new NotificacaoApiService({ httpClient });
