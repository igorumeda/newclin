import type { FontePagadora } from '../../../domain/entities/atendimento.entity';

export type IniciarAtendimentoInputDto = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  agendamentoId?: string | null;
  templateId?: string | null;
  especialidade?: string | null;
  fontePagadora?: FontePagadora;
};
