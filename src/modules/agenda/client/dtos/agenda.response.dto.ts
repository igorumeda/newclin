import type { StatusAgendamentoValue } from '../../domain/value-objects/status-agendamento.vo';
import type { AgendamentoDetalhado } from '../../domain/repositories/agenda-consulta-repository.interface';

export type AgendamentoResponseDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string;
  inicio: string;
  fim: string;
  duracaoMinutos: number;
  status: StatusAgendamentoValue;
  statusRotulo: string;
  encaixe: boolean;
  observacoes: string | null;
  motivoCancelamento: string | null;
  checkinEm: string | null;
  ordemChegada: number | null;
  origem: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type TipoAtendimentoResponseDto = {
  id: string;
  redeId: string;
  nome: string;
  duracaoMinutos: number;
  cor: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type BloqueioResponseDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  profissionalId: string | null;
  motivo: string;
  inicio: string;
  fim: string;
  criadoEm: string;
};

export type AgendaPeriodoResponseDto = {
  inicio: string;
  fim: string;
  agendamentos: AgendamentoDetalhado[];
  bloqueios: BloqueioResponseDto[];
};

export type FilaRecepcaoResponseDto = {
  titulo: string;
  status: StatusAgendamentoValue;
  agendamentos: AgendamentoDetalhado[];
};

export type PainelRecepcaoResponseDto = {
  data: string;
  totais: Record<StatusAgendamentoValue, number>;
  filas: FilaRecepcaoResponseDto[];
};
