export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'aguardando'
  | 'em_atendimento'
  | 'finalizado'
  | 'cancelado'
  | 'faltou';

export type StatusFinal = 'finalizado' | 'cancelado' | 'faltou';

export type OrigemConfirmacao = 'paciente' | 'recepcao' | 'sistema';

export const STATUS_AGENDAMENTO: StatusAgendamento[] = [
  'agendado',
  'confirmado',
  'aguardando',
  'em_atendimento',
  'finalizado',
  'cancelado',
  'faltou',
];

export const STATUS_LABELS: Record<StatusAgendamento, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

/**
 * Fluxo de status do §3.4 — espelha `transicao_status_valida()` do banco:
 *   agendado → confirmado → aguardando → em_atendimento → finalizado
 *   cancelado/faltou a partir dos estados ainda abertos.
 */
const TRANSICOES: Record<StatusAgendamento, StatusAgendamento[]> = {
  agendado: ['confirmado', 'aguardando', 'cancelado', 'faltou'],
  confirmado: ['aguardando', 'em_atendimento', 'cancelado', 'faltou'],
  aguardando: ['em_atendimento', 'cancelado', 'faltou'],
  em_atendimento: ['finalizado', 'cancelado'],
  finalizado: [],
  cancelado: [],
  faltou: [],
};

export function isStatusAgendamento(value: string): value is StatusAgendamento {
  return STATUS_AGENDAMENTO.includes(value as StatusAgendamento);
}

export function transicaoPermitida(de: StatusAgendamento, para: StatusAgendamento): boolean {
  if (de === para) return true;
  return TRANSICOES[de].includes(para);
}

export function statusFinal(status: StatusAgendamento): status is StatusFinal {
  return status === 'finalizado' || status === 'cancelado' || status === 'faltou';
}

export function statusOcupaAgenda(status: StatusAgendamento): boolean {
  return status !== 'cancelado' && status !== 'faltou';
}
