import { WhatsAppProvider } from './whatsapp-provider.base';
import type {
  EnviarWhatsAppParams,
  EventoWebhookWhatsApp,
  InterpretarWebhookParams,
  ResultadoEnvioWhatsApp,
} from '../../../domain/services/whatsapp-provider.interface';

export type MetaWhatsAppProviderDependencies = {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
};

type MetaMensagemWebhook = {
  from?: string;
  id?: string;
  timestamp?: string;
  text?: { body?: string };
  button?: { text?: string };
};
type MetaWebhookPayload = {
  entry?: Array<{ changes?: Array<{ value?: { messages?: MetaMensagemWebhook[] } }> }>;
};
type MetaRespostaEnvio = { messages?: Array<{ id?: string }>; error?: { message?: string } };

/** Adaptador da Meta Cloud API (WhatsApp Business). */
export class MetaWhatsAppProvider extends WhatsAppProvider {
  public readonly nome = 'meta';
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;

  constructor(dependencies: MetaWhatsAppProviderDependencies) {
    super();
    this.phoneNumberId = dependencies.phoneNumberId;
    this.accessToken = dependencies.accessToken;
    this.apiVersion = dependencies.apiVersion;
  }

  async enviar(params: EnviarWhatsAppParams): Promise<ResultadoEnvioWhatsApp> {
    try {
      const resposta = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: params.telefone,
            type: 'text',
            text: { preview_url: false, body: params.mensagem },
          }),
        },
      );
      const corpo = (await resposta.json()) as MetaRespostaEnvio;
      if (!resposta.ok) {
        return {
          sucesso: false,
          provider: this.nome,
          mensagemId: null,
          erro: corpo.error?.message ?? `HTTP ${resposta.status}`,
        };
      }
      return {
        sucesso: true,
        provider: this.nome,
        mensagemId: corpo.messages?.[0]?.id ?? null,
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
    const dados = (payload ?? {}) as MetaWebhookPayload;
    const eventos: EventoWebhookWhatsApp[] = [];

    dados.entry?.forEach((entrada) => {
      entrada.changes?.forEach((mudanca) => {
        mudanca.value?.messages?.forEach((mensagem) => {
          const texto = mensagem.text?.body ?? mensagem.button?.text;
          if (!mensagem.from || !texto) return;
          eventos.push({
            telefone: mensagem.from,
            mensagem: texto,
            mensagemId: mensagem.id ?? null,
            recebidoEm: mensagem.timestamp
              ? new Date(Number(mensagem.timestamp) * 1000)
              : new Date(),
          });
        });
      });
    });

    return eventos;
  }
}
