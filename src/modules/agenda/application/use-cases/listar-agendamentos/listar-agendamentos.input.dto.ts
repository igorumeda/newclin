import type { StatusAgendamentoValue } from '../../../domain/value-objects/status-agendamento.vo';

export type ListarAgendamentosInputDto = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  pacienteId?: string | null;
  status?: StatusAgendamentoValue[] | null;
  inicio: string;
  fim: string;
};
