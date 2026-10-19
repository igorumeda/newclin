import type { StatusAgendamento } from '../../domain/value-objects/status-agendamento.vo';
import type { TipoBloqueio } from '../../domain/entities/bloqueio-agenda.entity';

// ── Agendamentos ────────────────────────────────────────────────────────────
export type AgendamentoDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  unidadeNome: string | null;
  profissionalId: string;
  profissionalNome: string | null;
  profissionalCorAgenda: string | null;
  profissionalEspecialidade: string | null;
  pacienteId: string;
  pacienteNome: string | null;
  pacienteTelefone: string | null;
  pacienteCpf: string | null;
  tipoAtendimentoId: string | null;
  tipoAtendimentoNome: string | null;
  tipoAtendimentoCor: string | null;
  inicio: string;
  fim: string;
  duracaoMinutos: number;
  status: StatusAgendamento;
  statusLabel: string;
  encaixe: boolean;
  encaixeJustificativa: string | null;
  observacoes: string | null;
  checkInEm: string | null;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
  canceladoEm: string | null;
  motivoCancelamento: string | null;
  confirmadoEm: string | null;
  confirmadoPor: string | null;
  tempoEsperaMinutos: number | null;
  ordemChegada: number | null;
  createdAt: string;
};

export type ListarAgendaInputDto = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  pacienteId?: string | null;
  /** ISO (UTC). A conversão do fuso da unidade é feita no client/rota. */
  de: string;
  ate: string;
  status?: StatusAgendamento[] | null;
  incluirCancelados?: boolean;
  page?: number;
  perPage?: number;
};

export type ListarAgendaOutputDto = {
  items: AgendamentoDto[];
  total: number;
};

export type ObterAgendamentoInputDto = { agendamentoId: string };

export type ObterAgendamentoOutputDto = {
  agendamento: AgendamentoDto;
  historico: {
    id: string;
    statusAnterior: string | null;
    statusNovo: string;
    observacao: string | null;
    alteradoPor: string | null;
    createdAt: string;
  }[];
};

export type CriarAgendamentoInputDto = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId?: string | null;
  inicio: string;
  fim?: string | null;
  duracaoMinutos?: number | null;
  encaixe?: boolean;
  encaixeJustificativa?: string | null;
  observacoes?: string | null;
  criadoPor?: string | null;
  notificarPaciente?: boolean;
};

export type CriarAgendamentoOutputDto = AgendamentoDto;

export type AtualizarAgendamentoInputDto = {
  agendamentoId: string;
  unidadeId?: string;
  profissionalId?: string;
  inicio?: string;
  fim?: string | null;
  duracaoMinutos?: number | null;
  tipoAtendimentoId?: string | null;
  observacoes?: string | null;
  encaixe?: boolean;
  encaixeJustificativa?: string | null;
};

export type AtualizarAgendamentoOutputDto = AgendamentoDto;

export type AlterarStatusAgendamentoInputDto = {
  agendamentoId: string;
  novoStatus: StatusAgendamento;
  motivo?: string | null;
  por?: 'paciente' | 'recepcao' | 'sistema';
};

export type AlterarStatusAgendamentoOutputDto = AgendamentoDto;

export type CancelarAgendamentoInputDto = {
  agendamentoId: string;
  motivo: string;
  canceladoPor?: string | null;
};

export type CancelarAgendamentoOutputDto = AgendamentoDto;

export type RegistrarChegadaInputDto = { agendamentoId: string; unidadeId?: string | null };
export type RegistrarChegadaOutputDto = AgendamentoDto;

export type VerificarConflitoInputDto = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  inicio: string;
  fim: string;
  ignorarAgendamentoId?: string | null;
  /** Quando informado, o conflito acima libera encaixe com justificativa. */
  encaixe?: boolean;
};

export type VerificarConflitoOutputDto = {
  temConflito: boolean;
  conflitos: {
    agendamentoId: string;
    pacienteId: string;
    pacienteNome: string;
    inicio: string;
    fim: string;
    status: string;
    encaixe: boolean;
  }[];
  bloqueios: {
    bloqueioId: string;
    tipo: string;
    motivo: string | null;
    inicio: string;
    fim: string;
  }[];
  podeEncaixar: boolean;
};

// ── Painel da recepção ──────────────────────────────────────────────────────
export type PainelRecepcaoInputDto = {
  redeId: string;
  unidadeId: string;
  /** Data no fuso da unidade (YYYY-MM-DD). Padrão: hoje. */
  data?: string | null;
};

export type PainelRecepcaoOutputDto = {
  data: string;
  unidadeId: string;
  aguardando: AgendamentoDto[];
  emAtendimento: AgendamentoDto[];
  aChegar: AgendamentoDto[];
  finalizados: AgendamentoDto[];
  ausentes: AgendamentoDto[];
  indicadores: {
    total: number;
    confirmados: number;
    aguardando: number;
    emAtendimento: number;
    finalizados: number;
    faltas: number;
    tempoMedioEsperaMinutos: number;
  };
};

// ── Horários disponíveis ────────────────────────────────────────────────────
export type ListarHorariosDisponiveisInputDto = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  data: string;
  tipoAtendimentoId?: string | null;
  incluirPassados?: boolean;
};

export type ListarHorariosDisponiveisOutputDto = {
  data: string;
  timezone: string;
  duracaoMinutos: number;
  slots: {
    inicio: string;
    fim: string;
    disponivel: boolean;
    motivoIndisponibilidade: 'ocupado' | 'bloqueado' | 'passado' | null;
  }[];
};

// ── Tipos de atendimento ────────────────────────────────────────────────────
export type TipoAtendimentoDto = {
  id: string;
  redeId: string;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number;
  cor: string;
  requerConfirmacao: boolean;
  ativo: boolean;
  createdAt: string;
};

export type ListarTiposAtendimentoInputDto = {
  redeId: string;
  somenteAtivos?: boolean;
  busca?: string | null;
};

export type ListarTiposAtendimentoOutputDto = { items: TipoAtendimentoDto[] };

export type CriarTipoAtendimentoInputDto = {
  redeId: string;
  nome: string;
  descricao?: string | null;
  duracaoMinutos?: number;
  cor?: string;
  requerConfirmacao?: boolean;
};

export type CriarTipoAtendimentoOutputDto = TipoAtendimentoDto;

export type AtualizarTipoAtendimentoInputDto = {
  tipoAtendimentoId: string;
  nome?: string;
  descricao?: string | null;
  duracaoMinutos?: number;
  cor?: string;
  requerConfirmacao?: boolean;
};

export type AtualizarTipoAtendimentoOutputDto = TipoAtendimentoDto;

export type InativarTipoAtendimentoInputDto = { tipoAtendimentoId: string; reativar?: boolean };
export type InativarTipoAtendimentoOutputDto = TipoAtendimentoDto;

// ── Bloqueios de agenda ─────────────────────────────────────────────────────
export type BloqueioAgendaDto = {
  id: string;
  redeId: string;
  profissionalId: string;
  profissionalNome: string | null;
  unidadeId: string;
  unidadeNome: string | null;
  tipo: TipoBloqueio;
  tipoLabel: string;
  motivo: string | null;
  inicio: string;
  fim: string;
  diaInteiro: boolean;
  ativo: boolean;
  createdAt: string;
};

export type ListarBloqueiosInputDto = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  de: string;
  ate: string;
  somenteAtivos?: boolean;
};

export type ListarBloqueiosOutputDto = { items: BloqueioAgendaDto[] };

export type CriarBloqueioInputDto = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  tipo?: TipoBloqueio;
  motivo?: string | null;
  inicio: string;
  fim: string;
  diaInteiro?: boolean;
  criadoPor?: string | null;
};

export type CriarBloqueioOutputDto = BloqueioAgendaDto;

export type RemoverBloqueioInputDto = { bloqueioId: string };
export type RemoverBloqueioOutputDto = { bloqueioId: string };
