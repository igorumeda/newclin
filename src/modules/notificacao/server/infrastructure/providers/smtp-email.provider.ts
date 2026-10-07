import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailProvider } from './email-provider.base';
import type {
  EnviarEmailParams,
  ResultadoEnvioEmail,
} from '../../../domain/services/email-provider.interface';

export type SmtpEmailProviderDependencies = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

export class SmtpEmailProvider extends EmailProvider {
  private readonly transporter: Transporter;
  private readonly remetente: string;

  constructor(dependencies: SmtpEmailProviderDependencies) {
    super();
    this.transporter = nodemailer.createTransport({
      host: dependencies.host,
      port: dependencies.port,
      secure: dependencies.secure,
      auth: dependencies.user
        ? { user: dependencies.user, pass: dependencies.password }
        : undefined,
    });
    this.remetente = `"${dependencies.fromName}" <${dependencies.fromEmail}>`;
  }

  async enviar(params: EnviarEmailParams): Promise<ResultadoEnvioEmail> {
    try {
      const resposta = await this.transporter.sendMail({
        from: this.remetente,
        to: params.destinatario,
        subject: params.assunto,
        text: params.corpoTexto,
        html: params.corpoHtml ?? undefined,
      });
      return {
        sucesso: true,
        provider: 'smtp',
        mensagemId: resposta.messageId ?? null,
        erro: null,
      };
    } catch (erro) {
      return {
        sucesso: false,
        provider: 'smtp',
        mensagemId: null,
        erro: erro instanceof Error ? erro.message : 'Falha ao enviar e-mail',
      };
    }
  }
}
