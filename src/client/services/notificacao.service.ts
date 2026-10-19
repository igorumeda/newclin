import type {
  ModeloMensagemDto,
  NotificacaoDto,
} from '@/modules/notification/application/dtos/notificacao.dto';
import { api } from './api-client.service';

export type { ModeloMensagemDto, NotificacaoDto };

export const notificacaoService = {
  async listar(params: {
    tipo?: string;
    canal?: string;
    status?: string;
    pacienteId?: string;
    de?: string;
    ate?: string;
    page?: number;
    perPage?: number;
  }) {
    const resposta = await api.getWithMeta<NotificacaoDto[]>('/api/notificacoes', {
      query: { ...params, page: params.page ?? 1, perPage: params.perPage ?? 20 },
    });

    return { items: resposta.data, meta: resposta.meta ?? {} };
  },

  async listarModelos(): Promise<ModeloMensagemDto[]> {
    return api.get<ModeloMensagemDto[]>('/api/notificacoes/modelos');
  },

  async salvarModelo(input: {
    id?: string | null;
    canal: string;
    tipo: string;
    assunto?: string | null;
    corpo: string;
    ativo?: boolean;
  }): Promise<ModeloMensagemDto> {
    return api.put<ModeloMensagemDto>('/api/notificacoes/modelos', { body: input });
  },

  async reenviar(notificacaoId: string): Promise<NotificacaoDto> {
    return api.post<NotificacaoDto>(`/api/notificacoes/${notificacaoId}/reenviar`);
  },

  async processarFila(): Promise<{
    processadas: number;
    enviadas: number;
    falhas: number;
  }> {
    return api.post<{ processadas: number; enviadas: number; falhas: number }>(
      '/api/jobs/notificacoes/fila',
    );
  },

  async enfileirarLembretes(): Promise<{ agendamentosAnalisados: number; lembretesEnfileirados: number }> {
    return api.post<{ agendamentosAnalisados: number; lembretesEnfileirados: number }>(
      '/api/jobs/notificacoes/lembretes',
    );
  },
};
