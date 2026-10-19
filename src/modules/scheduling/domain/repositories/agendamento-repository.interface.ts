import type { Agendamento } from '../entities/agendamento.entity';
import type { StatusAgendamento } from '../value-objects/status-agendamento.vo';
import type { ConflitoAgendaDetalhe, BloqueioAgendaDetalhe } from '../errors/agendamento.errors';

export type AgendamentoId = string;

export type ListarAgendamentosFiltro = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  pacienteId?: string | null;
  /** Intervalo em UTC (ISO). */
  de: string;
  ate: string;
  status?: StatusAgendamento[] | null;
  incluirCancelados?: boolean;
  page?: number;
  perPage?: number;
};

export type ListarAgendamentosResultado = {
  items: Agendamento[];
  total: number;
};

export type VerificarConflitoParams = {
  profissionalId: string;
  unidadeId: string;
  inicio: string;
  fim: string;
  ignorarAgendamentoId?: string | null;
};

export type HistoricoStatusItem = {
  id: string;
  statusAnterior: string | null;
  statusNovo: string;
  observacao: string | null;
  alteradoPor: string | null;
  createdAt: string;
};

export interface IAgendamentoRepository {
  findById(id: AgendamentoId): Promise<Agendamento | null>;
  listar(filtro: ListarAgendamentosFiltro): Promise<ListarAgendamentosResultado>;
  save(agendamento: Agendamento): Promise<void>;
  update(agendamento: Agendamento): Promise<void>;
  verificarConflito(params: VerificarConflitoParams): Promise<ConflitoAgendaDetalhe[]>;
  verificarBloqueio(params: {
    profissionalId: string;
    unidadeId: string;
    inicio: string;
    fim: string;
  }): Promise<BloqueioAgendaDetalhe[]>;
  listarHistorico(agendamentoId: string): Promise<HistoricoStatusItem[]>;
  /** Conta agendamentos futuros por profissional (bloqueio de inativação). */
  contarFuturosPorProfissional(params: { profissionalId: string; aPartirDe: string }): Promise<number>;
}

export const AGENDAMENTO_REPOSITORY = Symbol('IAgendamentoRepository');
