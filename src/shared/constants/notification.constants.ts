export const NOTIFICATION_CHANNELS = ['email', 'whatsapp'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_KINDS = [
  'confirmacao',
  'lembrete',
  'documento',
  'cancelamento',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_STATUSES = [
  'pendente',
  'enviado',
  'entregue',
  'lido',
  'respondido',
  'falha',
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const REMINDER_HOURS_BEFORE = 24;
export const QUEUE_BATCH_SIZE = 25;
export const MAX_SEND_ATTEMPTS = 3;
