import type { OrigemAgendamento } from '../../../domain/entities/agendamento.entity';

export type CriarAgendamentoInputDto = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string;
  inicio: string;
  duracaoMinutos?: number | null;
  encaixe?: boolean;
  observacoes?: string | null;
  origem?: OrigemAgendamento;
  criadoPor?: string | null;
};
