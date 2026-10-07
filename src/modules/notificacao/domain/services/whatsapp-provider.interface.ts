export type EnviarWhatsAppParams = {
  telefone: string;
  mensagem: string;
  template?: string | null;
  variaveis?: Record<string, string>;
};
export type ResultadoEnvioWhatsApp = {
  sucesso: boolean;
  provider: string;
  mensagemId: string | null;
  erro: string | null;
};
export type EventoWebhookWhatsApp = {
  telefone: string;
  mensagem: string;
  mensagemId: string | null;
  recebidoEm: Date;
};
export type InterpretarWebhookParams = { payload: unknown };

/**
 * Porta de WhatsApp. Trocar de provedor (Meta, Twilio, Z-API, 360dialog)
 * exige apenas uma nova implementação desta interface (spec §4.2).
 */
export interface IWhatsAppProvider {
  readonly nome: string;
  enviar(params: EnviarWhatsAppParams): Promise<ResultadoEnvioWhatsApp>;
  interpretarWebhook(params: InterpretarWebhookParams): EventoWebhookWhatsApp[];
}

export const WHATSAPP_PROVIDER = Symbol('IWhatsAppProvider');
