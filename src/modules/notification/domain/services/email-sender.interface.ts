/**
 * Porta de envio de e-mail (SMTP). A implementação concreta vive em
 * `server/infrastructure/providers` — o domínio não conhece Nodemailer.
 */
export type EnviarEmailParams = {
  para: string;
  assunto: string;
  corpo: string;
  corpoHtml?: string | null;
  replyTo?: string | null;
  anexos?: { nome: string; conteudoBase64: string; mimeType: string }[];
};

export type EnviarEmailResultado = {
  provider: string;
  messageId: string | null;
  remetente: string | null;
};

export type EmailSenderHealth = {
  configurado: boolean;
  remetente: string | null;
  motivo: string | null;
};

export interface IEmailSender {
  enviar(params: EnviarEmailParams): Promise<EnviarEmailResultado>;
  health(): EmailSenderHealth;
}

export const EMAIL_SENDER = Symbol('IEmailSender');
