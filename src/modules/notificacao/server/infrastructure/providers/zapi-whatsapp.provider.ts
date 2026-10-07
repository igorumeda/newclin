import { WhatsAppProvider } from './whatsapp-provider.base';
import type {
  EnviarWhatsAppParams,
  EventoWebhookWhatsApp,
  InterpretarWebhookParams,
  ResultadoEnvioWhatsApp,
} from '../../../domain/services/whatsapp-provider.interface';

export type ZapiWhatsAppProviderDependencies = {
  baseUrl: string;
  instanceId: string;
  token: string;
  clientToken: string;
};

type ZapiRespostaEnvio = { messageId?: string; zaapId?: string; error?: string };
type ZapiWebhookPayload = {
  phone?: string;
  messageId?: string;
  momment?: number;
  text?: { message?: string };
  buttonsResponseMessage?: { message?: string };
};

/** Adaptador Z-API — exemplo de provedor alternativo plugável. */
export class ZapiWhatsAppProvider extends WhatsAppProvider {
  public readonly nome = 'zapi';
  private readonly baseUrl: string;
  private readonly instanceId: string;
  private readonly token: string;
  private readonly clientToken: string;

  constructor(dependencies: ZapiWhatsAppProviderDependencies) {
    super();
    this.baseUrl = dependencies.baseUrl.replace(/\/$/, '');
    this.instanceId = dependencies.instanceId;
    this.token = dependencies.token;
    this.clientToken = dependencies.clientToken;
  }

  async enviar(params: EnviarWhatsAppParams): Promise<ResultadoEnvioWhatsApp> {
    try {
      const resposta = await fetch(
        `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/send-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': this.clientToken,
          },
          body: JSON.stringify({ phone: params.telefone, message: params.mensagem }),
        },
      );
      const corpo = (await resposta.json()) as ZapiRespostaEnvio;
      if (!resposta.ok || corpo.error) {
        return {
          sucesso: false,
          provider: this.nome,
          mensagemId: null,
          erro: corpo.error ?? `HTTP ${resposta.status}`,
        };
      }
      return {
        sucesso: true,
        provider: this.nome,
        mensagemId: corpo.messageId ?? corpo.zaapId ?? null,
        erro: null,
      };
    } catch (erro) {
      return {
        sucesso: false,
        provider: this.nome,
        mensagemId: null,
        erro: erro instanceof Error ? erro.message : 'Falha ao enviar WhatsApp',
      };
    }
  }

  interpretarWebhook({ payload }: InterpretarWebhookParams): EventoWebhookWhatsApp[] {
    const dados = (payload ?? {}) as ZapiWebhookPayload;
    const texto = dados.text?.message ?? dados.buttonsResponseMessage?.message;
    if (!dados.phone || !texto) return [];
    return [
      {
        telefone: dados.phone,
        mensagem: texto,
        mensagemId: dados.messageId ?? null,
        recebidoEm: dados.momment ? new Date(dados.momment) : new Date(),
      },
    ];
  }
}
