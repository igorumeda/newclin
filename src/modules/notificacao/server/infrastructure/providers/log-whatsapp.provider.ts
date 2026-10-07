import { WhatsAppProvider } from './whatsapp-provider.base';
import type {
  EnviarWhatsAppParams,
  EventoWebhookWhatsApp,
  InterpretarWebhookParams,
  ResultadoEnvioWhatsApp,
} from '../../../domain/services/whatsapp-provider.interface';

type PayloadLog = { telefone?: string; mensagem?: string; id?: string };

/** Driver padrão de desenvolvimento, sem integração externa. */
export class LogWhatsAppProvider extends WhatsAppProvider {
  public readonly nome = 'log';

  async enviar(params: EnviarWhatsAppParams): Promise<ResultadoEnvioWhatsApp> {
    // eslint-disable-next-line no-console
    console.info(`[whatsapp:log] para=${params.telefone}\n${params.mensagem}`);
    return { sucesso: true, provider: this.nome, mensagemId: `log-${Date.now()}`, erro: null };
  }

  interpretarWebhook({ payload }: InterpretarWebhookParams): EventoWebhookWhatsApp[] {
    const dados = (payload ?? {}) as PayloadLog;
    if (!dados.telefone || !dados.mensagem) return [];
    return [
      {
        telefone: dados.telefone,
        mensagem: dados.mensagem,
        mensagemId: dados.id ?? null,
        recebidoEm: new Date(),
      },
    ];
  }
}
