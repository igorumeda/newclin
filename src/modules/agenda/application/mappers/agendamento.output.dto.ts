import type { StatusAgendamentoValue } from '../../domain/value-objects/status-agendamento.vo';
import type { OrigemAgendamento } from '../../domain/entities/agendamento.entity';

export type AgendamentoOutputDto = {
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
  origem: OrigemAgendamento;
  criadoEm: string;
  atualizadoEm: string;
};
