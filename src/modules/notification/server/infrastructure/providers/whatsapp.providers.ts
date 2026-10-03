import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  EnviarWhatsappParams,
  EnviarWhatsappResultado,
  IWhatsappSender,
  MensagemWhatsappRecebida,
  WhatsappSenderHealth,
} from '../../../domain/services/whatsapp-sender.interface';
import type { RespostaAcao } from '../../../domain/value-objects/tipos.vo';
import { NotificationProviderError } from '../../../domain/errors/notificacao.errors';

export type MetaWhatsappProviderDependencies = {
  apiUrl: string;
  token: string | null;
  phoneNumberId: string | null;
  appSecret: string | null;
  webhookVerifyToken: string | null;
};

type MetaMensagem = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
};

type MetaWebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        messages?: MetaMensagem[];
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        statuses?: { id?: string; status?: string; recipient_id?: string }[];
      };
    }[];
  }[];
};

/**
 * Provedor WhatsApp Cloud API (Meta) — mensagens com botões de resposta e
 * webhook assinado com HMAC-SHA256 (`X-Hub-Signature-256`).
 */
export class MetaWhatsappProvider implements IWhatsappSender {
  private readonly apiUrl: string;
  private readonly token: string | null;
  private readonly phoneNumberId: string | null;
  private readonly appSecret: string | null;

  constructor(dependencies: MetaWhatsappProviderDependencies) {
    this.apiUrl = dependencies.apiUrl.replace(/\/$/, '');
    this.token = dependencies.token;
    this.phoneNumberId = dependencies.phoneNumberId;
    this.appSecret = dependencies.appSecret;
    void dependencies.webhookVerifyToken;
  }

  health(): WhatsappSenderHealth {
    if (!this.token || !this.phoneNumberId) {
      return {
        provider: 'meta',
        configurado: false,
        motivo: 'WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID são obrigatórios',
      };
    }
    return { provider: 'meta', configurado: true, motivo: null };
  }

  async enviar(params: EnviarWhatsappParams): Promise<EnviarWhatsappResultado> {
    const health = this.health();
    if (!health.configurado) {
      throw new NotificationProviderError({
        provider: 'meta',
        motivo: health.motivo ?? 'Provedor WhatsApp indisponível',
      });
    }

    const payload = params.botoes && params.botoes.length > 0
      ? {
          messaging_product: 'whatsapp',
          to: params.para,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: params.corpo },
            action: {
              buttons: params.botoes.slice(0, 3).map((botao) => ({
                type: 'reply',
                reply: { id: `${botao.acao}:${params.para}`, title: botao.label },
              })),
            },
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: params.para,
          type: 'text',
          text: { preview_url: false, body: params.corpo },
        };

    const resposta = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text();
      throw new NotificationProviderError({
        provider: 'meta',
        motivo: `HTTP ${resposta.status}: ${corpo.slice(0, 300)}`,
      });
    }

    const json = (await resposta.json()) as { messages?: { id?: string }[] };

    return {
      provider: 'meta',
      messageId: json.messages?.[0]?.id ?? null,
      botoesEnviados: Boolean(params.botoes?.length),
    };
  }

  verificarAssinatura(params: { payload: string; assinatura: string | null }): boolean {
    // Sem segredo configurado (ambiente de desenvolvimento) a validação é relaxada.
    if (!this.appSecret) return true;
    if (!params.assinatura) return false;

    const esperado = `sha256=${createHmac('sha256', this.appSecret).update(params.payload).digest('hex')}`;
    const recebido = params.assinatura;

    if (esperado.length !== recebido.length) return false;
    return timingSafeEqual(Buffer.from(esperado), Buffer.from(recebido));
  }

  interpretarWebhook(payload: unknown): MensagemWhatsappRecebida[] {
    const dados = payload as MetaWebhookPayload;
    const mensagens: MensagemWhatsappRecebida[] = [];

    for (const entry of dados.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;

        const nomeContato = value.contacts?.[0]?.profile?.name ?? null;

        for (const mensagem of value.messages ?? []) {
          const texto = this.extrairTexto(mensagem);
          mensagens.push({
            providerMessageId: mensagem.id ?? null,
            telefone: mensagem.from ?? '',
            nomeContato,
            texto,
            acao: this.interpretarAcao(texto, mensagem),
            recebidaEm: mensagem.timestamp
              ? new Date(Number(mensagem.timestamp) * 1000)
              : new Date(),
            status: 'recebida',
          });
        }
      }
    }

    return mensagens;
  }

  private extrairTexto(mensagem: MetaMensagem): string {
    if (mensagem.interactive?.button_reply) {
      return mensagem.interactive.button_reply.title ?? mensagem.interactive.button_reply.id ?? '';
    }
    if (mensagem.interactive?.list_reply) {
      return mensagem.interactive.list_reply.title ?? mensagem.interactive.list_reply.id ?? '';
    }
    if (mensagem.button) return mensagem.button.text ?? mensagem.button.payload ?? '';
    return mensagem.text?.body ?? '';
  }

  private interpretarAcao(texto: string, mensagem: MetaMensagem): RespostaAcao | null {
    const idBotao = mensagem.interactive?.button_reply?.id ?? mensagem.button?.payload ?? '';
    if (idBotao.startsWith('confirmar')) return 'confirmar';
    if (idBotao.startsWith('cancelar')) return 'cancelar';

    const normalizado = texto.trim().toLowerCase();
    if (['1', 'sim', 's', 'confirmar', 'confirmo', 'ok'].includes(normalizado)) return 'confirmar';
    if (['2', 'nao', 'não', 'n', 'cancelar', 'cancelo'].includes(normalizado)) return 'cancelar';

    return null;
  }
}

export type NoopWhatsappProviderDependencies = {
  motivo?: string;
};

/**
 * Provedor de desenvolvimento: registra a mensagem no console e simula o
 * envio, permitindo testar a fila sem credenciais de WhatsApp.
 */
export class NoopWhatsappProvider implements IWhatsappSender {
  private readonly motivo: string;

  constructor(dependencies: NoopWhatsappProviderDependencies = {}) {
    this.motivo = dependencies.motivo ?? 'WHATSAPP_PROVIDER não configurado (usando modo simulado)';
  }

  health(): WhatsappSenderHealth {
    return { provider: 'noop', configurado: true, motivo: this.motivo };
  }

  async enviar(params: EnviarWhatsappParams): Promise<EnviarWhatsappResultado> {
    console.info(
      `[notificacao:whatsapp:simulado] para=${params.para} botoes=${params.botoes?.length ?? 0}`,
    );

    return {
      provider: 'noop',
      messageId: `simulado-${Date.now()}`,
      botoesEnviados: Boolean(params.botoes?.length),
    };
  }

  verificarAssinatura(): boolean {
    return true;
  }

  interpretarWebhook(payload: unknown): MensagemWhatsappRecebida[] {
    const dados = payload as {
      telefone?: string;
      texto?: string;
      mensagemId?: string;
    };

    if (!dados?.telefone) return [];

    const texto = dados.texto ?? '';
    const normalizado = texto.trim().toLowerCase();
    const acao: RespostaAcao | null = ['1', 'sim', 'confirmar'].includes(normalizado)
      ? 'confirmar'
      : ['2', 'nao', 'não', 'cancelar'].includes(normalizado)
        ? 'cancelar'
        : null;

    return [
      {
        providerMessageId: dados.mensagemId ?? null,
        telefone: dados.telefone,
        nomeContato: null,
        texto,
        acao,
        recebidaEm: new Date(),
        status: 'recebida',
      },
    ];
  }
}
