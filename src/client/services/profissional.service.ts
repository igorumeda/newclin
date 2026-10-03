import type { ProfissionalDto } from '@/modules/professional/application/dtos/profissional.dto';
import { api } from './api-client.service';

export type { ProfissionalDto };

export type HorarioPayload = {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  duracaoSlotMinutos?: number;
  intervaloMinutos?: number;
};

export type ProfissionalPayload = {
  nome: string;
  cpf?: string | null;
  /** CRM, CRO, COREN, CRP… (obrigatório no cadastro). */
  conselhoClasse: string;
  numeroConselho: string;
  ufConselho?: string | null;
  especialidade?: string | null;
  registroEspecialista?: string | null;
  telefone?: string | null;
  email?: string | null;
  corAgenda?: string | null;
  observacoes?: string | null;
  /** Unidades em que o profissional atende. */
  unidades?: string[];
};

export const profissionalService = {
  async listar(
    params: {
      busca?: string;
      especialidade?: string;
      unidadeId?: string;
      ativo?: boolean;
      incluirHorarios?: boolean;
    } = {},
  ) {
    const resposta = await api.getWithMeta<ProfissionalDto[]>('/api/profissionais', {
      query: {
        busca: params.busca,
        especialidade: params.especialidade,
        unidadeId: params.unidadeId,
        ativo: params.ativo === undefined ? undefined : String(params.ativo),
        incluirHorarios: params.incluirHorarios === undefined ? undefined : String(params.incluirHorarios),
      },
    });

    return { items: resposta.data, meta: resposta.meta ?? {} };
  },

  async criar(input: ProfissionalPayload): Promise<ProfissionalDto> {
    return api.post<ProfissionalDto>('/api/profissionais', { body: input });
  },

  async atualizar(profissionalId: string, input: Partial<ProfissionalPayload>): Promise<ProfissionalDto> {
    return api.put<ProfissionalDto>(`/api/profissionais/${profissionalId}`, { body: input });
  },

  async inativar(profissionalId: string): Promise<ProfissionalDto> {
    return api.delete<ProfissionalDto>(`/api/profissionais/${profissionalId}`);
  },

  async reativar(profissionalId: string): Promise<ProfissionalDto> {
    return api.post<ProfissionalDto>(`/api/profissionais/${profissionalId}/reativar`);
  },

  async definirHorarios(
    profissionalId: string,
    unidadeId: string,
    horarios: HorarioPayload[],
  ): Promise<ProfissionalDto> {
    return api.put<ProfissionalDto>(`/api/profissionais/${profissionalId}/horarios`, {
      body: { unidadeId, horarios },
    });
  },

  async definirUnidades(profissionalId: string, unidadeIds: string[]): Promise<ProfissionalDto> {
    return api.put<ProfissionalDto>(`/api/profissionais/${profissionalId}/unidades`, {
      body: { unidadeIds },
    });
  },
};
