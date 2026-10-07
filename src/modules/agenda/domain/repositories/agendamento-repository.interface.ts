import type { Agendamento } from '../entities/agendamento.entity';
import type { StatusAgendamentoValue } from '../value-objects/status-agendamento.vo';

export type BuscarAgendamentoParams = { redeId: string; id: string };
export type ListarAgendamentosParams = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  pacienteId?: string | null;
  inicio: string;
  fim: string;
  status?: StatusAgendamentoValue[] | null;
};
export type ListarPorPacienteParams = { redeId: string; pacienteId: string; limite?: number };
export type ProximaOrdemChegadaParams = { redeId: string; unidadeId: string; data: string };
export type ContarPorStatusParams = {
  redeId: string;
  unidadeId?: string | null;
  inicio: string;
  fim: string;
};
export type ContagemPorStatus = { status: StatusAgendamentoValue; total: number };
export type ListarParaLembreteParams = { redeId?: string | null; de: string; ate: string };

export interface IAgendamentoRepository {
  buscarPorId(params: BuscarAgendamentoParams): Promise<Agendamento | null>;
  listar(params: ListarAgendamentosParams): Promise<Agendamento[]>;
  listarPorPaciente(params: ListarPorPacienteParams): Promise<Agendamento[]>;
  listarParaLembrete(params: ListarParaLembreteParams): Promise<Agendamento[]>;
  proximaOrdemChegada(params: ProximaOrdemChegadaParams): Promise<number>;
  contarPorStatus(params: ContarPorStatusParams): Promise<ContagemPorStatus[]>;
  salvar(agendamento: Agendamento): Promise<void>;
  atualizar(agendamento: Agendamento): Promise<void>;
}

export const AGENDAMENTO_REPOSITORY = Symbol('IAgendamentoRepository');
