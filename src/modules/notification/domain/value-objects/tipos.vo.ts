export type CanalNotificacao = 'email' | 'whatsapp';

export type TipoNotificacao = 'confirmacao' | 'lembrete' | 'documento' | 'cancelamento';

export type StatusNotificacao =
  | 'pendente'
  | 'enviado'
  | 'entregue'
  | 'lido'
  | 'respondido'
  | 'falha'
  | 'cancelado';

export type RespostaAcao = 'confirmar' | 'cancelar';

export type VariaveisMensagem = Record<string, string>;
