import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type {
  EmailSenderHealth,
  EnviarEmailParams,
  EnviarEmailResultado,
  IEmailSender,
} from '../../../domain/services/email-sender.interface';
import { NotificationProviderError } from '../../../domain/errors/notificacao.errors';

export type SmtpEmailProviderDependencies = {
  host: string | null;
  port: number;
  secure: boolean;
  usuario: string | null;
  senha: string | null;
  remetente: string | null;
  replyTo: string | null;
};

/** Mesma interface usada quando o SMTP ainda não foi configurado no `.env`. */
export class SmtpEmailProvider implements IEmailSender {
  private readonly host: string | null;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly usuario: string | null;
  private readonly senha: string | null;
  private readonly remetente: string | null;
  private readonly replyTo: string | null;
  private transporter: Transporter | null = null;

  constructor(dependencies: SmtpEmailProviderDependencies) {
    this.host = dependencies.host;
    this.port = dependencies.port;
    this.secure = dependencies.secure;
    this.usuario = dependencies.usuario;
    this.senha = dependencies.senha;
    this.remetente = dependencies.remetente;
    this.replyTo = dependencies.replyTo;
  }

  health(): EmailSenderHealth {
    if (!this.host) {
      return {
        configurado: false,
        remetente: this.remetente,
        motivo: 'SMTP_HOST não configurado no .env',
      };
    }
    return { configurado: true, remetente: this.remetente, motivo: null };
  }

  async enviar(params: EnviarEmailParams): Promise<EnviarEmailResultado> {
    const health = this.health();
    if (!health.configurado) {
      throw new NotificationProviderError({ provider: 'smtp', motivo: health.motivo ?? 'SMTP indisponível' });
    }

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: this.remetente ?? this.usuario ?? 'nao-responder@clinica.local',
        to: params.para,
        replyTo: params.replyTo ?? this.replyTo ?? undefined,
        subject: params.assunto,
        text: params.corpo,
        html: params.corpoHtml ?? this.toHtml(params.corpo),
        attachments: params.anexos?.map((anexo) => ({
          filename: anexo.nome,
          content: anexo.conteudoBase64,
          encoding: 'base64',
          contentType: anexo.mimeType,
        })),
      });

      return {
        provider: 'smtp',
        messageId: info.messageId ?? null,
        remetente: this.remetente ?? this.usuario,
      };
    } catch (error) {
      throw new NotificationProviderError({
        provider: 'smtp',
        motivo: error instanceof Error ? error.message : 'Erro desconhecido no envio SMTP',
        cause: error,
      });
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: this.host ?? undefined,
      port: this.port,
      secure: this.secure,
      auth: this.usuario ? { user: this.usuario, pass: this.senha ?? '' } : undefined,
    });

    return this.transporter;
  }

  /** Converte quebras de linha em parágrafos simples de HTML. */
  private toHtml(corpo: string): string {
    const escapado = corpo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#0f172a">${escapado
      .split(/\n{2,}/)
      .map((paragrafo) => `<p>${paragrafo.replace(/\n/g, '<br />')}</p>`)
      .join('')}</div>`;
  }
}
