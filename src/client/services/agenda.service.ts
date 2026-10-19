import type {
  AgendamentoDto,
  BloqueioAgendaDto,
  ListarHorariosDisponiveisOutputDto,
  PainelRecepcaoOutputDto,
  TipoAtendimentoDto,
  VerificarConflitoOutputDto,
} from '@/modules/scheduling/application/dtos/agenda.dto';
import { api } from './api-client.service';

export type {
  AgendamentoDto,
  BloqueioAgendaDto,
  ListarHorariosDisponiveisOutputDto,
  PainelRecepcaoOutputDto,
  TipoAtendimentoDto,
  VerificarConflitoOutputDto,
};

/** Item de agenda = agendamento enriquecido (nomes de paciente/profissional). */
export type AgendaItemDto = AgendamentoDto;

export type ListarAgendaParams = {
  unidadeId?: string;
  profissionalId?: string;
  pacienteId?: string;
  /** Instantes ISO em UTC — convertidos a partir do fuso da unidade na página. */
  de: string;
  ate: string;
  status?: string;
  incluirCancelados?: boolean;
  page?: number;
  perPage?: number;
};

export type AgendamentoPayload = {
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  tipoAtendimentoId?: string | null;
  /** Início em ISO UTC. */
  inicio: string;
  fim?: string | null;
  duracaoMinutos?: number | null;
  observacoes?: string | null;
  encaixe?: boolean;
  encaixeJustificativa?: string | null;
  notificarPaciente?: boolean;
};

export const agendaService = {
  async listar(params: ListarAgendaParams): Promise<AgendaItemDto[]> {
    const resposta = await api.getWithMeta<AgendamentoDto[]>('/api/agenda', {
      query: {
        unidadeId: params.unidadeId,
        profissionalId: params.profissionalId,
        pacienteId: params.pacienteId,
        de: params.de,
        ate: params.ate,
        status: params.status,
        incluirCancelados:
          params.incluirCancelados === undefined ? undefined : String(params.incluirCancelados),
        page: params.page ?? 1,
        perPage: params.perPage ?? 200,
      },
    });

    return resposta.data;
  },

  async obter(agendamentoId: string): Promise<AgendaItemDto> {
    return api.get<AgendamentoDto>(`/api/agendamentos/${agendamentoId}`);
  },

  async criar(input: AgendamentoPayload): Promise<AgendaItemDto> {
    return api.post<AgendamentoDto>('/api/agendamentos', { body: input });
  },

  async atualizar(agendamentoId: string, input: Partial<AgendamentoPayload>): Promise<AgendaItemDto> {
    return api.put<AgendamentoDto>(`/api/agendamentos/${agendamentoId}`, { body: input });
  },

  async alterarStatus(
    agendamentoId: string,
    input: { novoStatus: string; motivo?: string | null },
  ): Promise<AgendaItemDto> {
    return api.patch<AgendamentoDto>(`/api/agendamentos/${agendamentoId}/status`, { body: input });
  },

  async cancelar(agendamentoId: string, motivo: string): Promise<AgendaItemDto> {
    return api.post<AgendamentoDto>(`/api/agendamentos/${agendamentoId}/cancelar`, { body: { motivo } });
  },

  async registrarChegada(agendamentoId: string): Promise<AgendaItemDto> {
    return api.post<AgendamentoDto>(`/api/recepcao/check-in/${agendamentoId}`);
  },

  async painelRecepcao(input: { unidadeId: string; data?: string }): Promise<PainelRecepcaoOutputDto> {
    return api.get<PainelRecepcaoOutputDto>('/api/recepcao/painel', {
      query: { unidadeId: input.unidadeId, data: input.data },
    });
  },

  async verificarConflito(input: {
    unidadeId: string;
    profissionalId: string;
    inicio: string;
    fim: string;
    ignorarAgendamentoId?: string | null;
    encaixe?: boolean;
  }): Promise<VerificarConflitoOutputDto> {
    return api.post<VerificarConflitoOutputDto>('/api/agenda/verificar-conflito', { body: input });
  },

  async horariosDisponiveis(input: {
    unidadeId: string;
    profissionalId: string;
    data: string;
    tipoAtendimentoId?: string | null;
    incluirPassados?: boolean;
  }): Promise<ListarHorariosDisponiveisOutputDto> {
    return api.get<ListarHorariosDisponiveisOutputDto>('/api/agenda/horarios-disponiveis', {
      query: { ...input, incluirPassados: input.incluirPassados ? 'true' : undefined },
    });
  },

  async listarTiposAtendimento(params: { somenteAtivos?: boolean; busca?: string } = {}): Promise<
    TipoAtendimentoDto[]
  > {
    return api.get<TipoAtendimentoDto[]>('/api/tipos-atendimento', {
      query: {
        somenteAtivos:
          params.somenteAtivos === undefined ? undefined : params.somenteAtivos ? 'true' : 'false',
        busca: params.busca,
      },
    });
  },

  async criarTipoAtendimento(input: {
    nome: string;
    descricao?: string | null;
    duracaoMinutos: number;
    cor: string;
    requerConfirmacao?: boolean;
  }): Promise<TipoAtendimentoDto> {
    return api.post<TipoAtendimentoDto>('/api/tipos-atendimento', { body: input });
  },

  async atualizarTipoAtendimento(
    tipoId: string,
    input: Partial<{
      nome: string;
      descricao: string | null;
      duracaoMinutos: number;
      cor: string;
      requerConfirmacao: boolean;
    }>,
  ): Promise<TipoAtendimentoDto> {
    return api.put<TipoAtendimentoDto>(`/api/tipos-atendimento/${tipoId}`, { body: input });
  },

  async inativarTipoAtendimento(tipoId: string): Promise<TipoAtendimentoDto> {
    return api.delete<TipoAtendimentoDto>(`/api/tipos-atendimento/${tipoId}`);
  },

  async reativarTipoAtendimento(tipoId: string): Promise<TipoAtendimentoDto> {
    return api.post<TipoAtendimentoDto>(`/api/tipos-atendimento/${tipoId}/reativar`);
  },

  async listarBloqueios(params: { unidadeId?: string; profissionalId?: string; de?: string; ate?: string }) {
    const resposta = await api.getWithMeta<BloqueioAgendaDto[]>('/api/bloqueios', { query: params });
    return resposta.data;
  },

  async criarBloqueio(input: {
    unidadeId: string;
    profissionalId: string;
    tipo?: string;
    inicio: string;
    fim: string;
    motivo?: string | null;
  }): Promise<BloqueioAgendaDto> {
    return api.post<BloqueioAgendaDto>('/api/bloqueios', { body: input });
  },

  async removerBloqueio(bloqueioId: string): Promise<{ bloqueioId: string }> {
    return api.delete<{ bloqueioId: string }>(`/api/bloqueios/${bloqueioId}`);
  },
};
