import type { CanalNotificacao, StatusNotificacao, TipoNotificacao } from './tipos.vo';

export type { CanalNotificacao, StatusNotificacao, TipoNotificacao };

export const CANAIS_NOTIFICACAO: CanalNotificacao[] = ['email', 'whatsapp'];

export const TIPOS_NOTIFICACAO: TipoNotificacao[] = [
  'confirmacao',
  'lembrete',
  'documento',
  'cancelamento',
];

export const STATUS_NOTIFICACAO: StatusNotificacao[] = [
  'pendente',
  'enviado',
  'entregue',
  'lido',
  'respondido',
  'falha',
  'cancelado',
];

export const CANAL_LABELS: Record<CanalNotificacao, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
};

export const TIPO_LABELS: Record<TipoNotificacao, string> = {
  confirmacao: 'Confirmação',
  lembrete: 'Lembrete',
  documento: 'Envio de documento',
  cancelamento: 'Cancelamento',
};

export const STATUS_LABELS: Record<StatusNotificacao, string> = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  entregue: 'Entregue',
  lido: 'Lido',
  respondido: 'Respondido',
  falha: 'Falha',
  cancelado: 'Cancelado',
};

export function isCanalNotificacao(value: string): value is CanalNotificacao {
  return CANAIS_NOTIFICACAO.includes(value as CanalNotificacao);
}

export function isTipoNotificacao(value: string): value is TipoNotificacao {
  return TIPOS_NOTIFICACAO.includes(value as TipoNotificacao);
}

/** Status finais não retornam à fila. */
export const STATUS_FINAIS: StatusNotificacao[] = ['entregue', 'lido', 'respondido', 'cancelado'];
