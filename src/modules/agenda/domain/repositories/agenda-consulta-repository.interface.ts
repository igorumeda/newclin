import type { StatusAgendamentoValue } from '../value-objects/status-agendamento.vo';

export type ResumoPacienteAgenda = {
  id: string;
  nome: string;
  telefone: string | null;
  dataNascimento: string;
};
export type ResumoProfissionalAgenda = {
  id: string;
  nome: string;
  especialidade: string;
  corAgenda: string;
};
export type ResumoUnidadeAgenda = { id: string; nome: string; fusoHorario: string };
export type ResumoTipoAtendimentoAgenda = {
  id: string;
  nome: string;
  cor: string;
  duracaoMinutos: number;
};

/** Projeção de leitura da agenda (grade, painel de recepção e listagens). */
export type AgendamentoDetalhado = {
  id: string;
  inicio: string;
  fim: string;
  status: StatusAgendamentoValue;
  encaixe: boolean;
  observacoes: string | null;
  motivoCancelamento: string | null;
  checkinEm: string | null;
  ordemChegada: number | null;
  origem: string;
  atendimentoId: string | null;
  paciente: ResumoPacienteAgenda;
  profissional: ResumoProfissionalAgenda;
  unidade: ResumoUnidadeAgenda;
  tipoAtendimento: ResumoTipoAtendimentoAgenda;
};

export type ConsultarAgendaParams = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  pacienteId?: string | null;
  status?: StatusAgendamentoValue[] | null;
  inicio: string;
  fim: string;
};
export type ConsultarAgendamentoParams = { redeId: string; id: string };

export interface IAgendaConsultaRepository {
  consultar(params: ConsultarAgendaParams): Promise<AgendamentoDetalhado[]>;
  obter(params: ConsultarAgendamentoParams): Promise<AgendamentoDetalhado | null>;
}

export const AGENDA_CONSULTA_REPOSITORY = Symbol('IAgendaConsultaRepository');
