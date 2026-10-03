import type { RespostaAcao } from '../value-objects/tipos.vo';

/** Botões de confirmação enviados junto da mensagem (§4.2). */
export type BotaoResposta = {
  acao: RespostaAcao;
  label: string;
};

export type EnviarWhatsappParams = {
  para: string;
  corpo: string;
  botoes?: BotaoResposta[];
};

export type EnviarWhatsappResultado = {
  provider: string;
  messageId: string | null;
  /** `false` quando o provedor não suporta botões e o texto foi enviado com fallback. */
  botoesEnviados: boolean;
};

export type MensagemWhatsappRecebida = {
  providerMessageId: string | null;
  telefone: string;
  nomeContato: string | null;
  texto: string;
  acao: RespostaAcao | null;
  recebidaEm: Date;
  status: 'recebida' | 'entregue' | 'lida';
};

export type WhatsappSenderHealth = {
  provider: string;
  configurado: boolean;
  motivo: string | null;
};

export interface IWhatsappSender {
  enviar(params: EnviarWhatsappParams): Promise<EnviarWhatsappResultado>;
  /** Normaliza o payload bruto do provedor (webhook) para o modelo interno. */
  interpretarWebhook(payload: unknown): MensagemWhatsappRecebida[];
  verificarAssinatura(params: { payload: string; assinatura: string | null }): boolean;
  health(): WhatsappSenderHealth;
}

export const WHATSAPP_SENDER = Symbol('IWhatsappSender');
