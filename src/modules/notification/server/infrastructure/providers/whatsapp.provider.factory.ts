import type { IWhatsappSender } from '../../../domain/services/whatsapp-sender.interface';
import { MetaWhatsappProvider, NoopWhatsappProvider } from './whatsapp.providers';

export type WhatsappProviderConfig = {
  provider: 'meta' | 'zapi' | 'twilio' | '360dialog' | 'noop';
  apiUrl: string;
  token: string | null;
  phoneNumberId: string | null;
  appSecret: string | null;
  webhookVerifyToken: string | null;
};

/**
 * Fábrica do provedor de WhatsApp (§4.2). O restante do sistema depende apenas
 * da porta `IWhatsappSender`, então trocar de provedor é trocar este mapeamento.
 */
export function createWhatsappProvider(config: WhatsappProviderConfig): IWhatsappSender {
  switch (config.provider) {
    case 'meta':
      return new MetaWhatsappProvider({
        apiUrl: config.apiUrl,
        token: config.token,
        phoneNumberId: config.phoneNumberId,
        appSecret: config.appSecret,
        webhookVerifyToken: config.webhookVerifyToken,
      });
    default:
      return new NoopWhatsappProvider({
        motivo:
          config.provider === 'noop'
            ? 'WHATSAPP_PROVIDER=noop: mensagens são simuladas e registradas no log'
            : `Provedor "${config.provider}" ainda não implementado — usando modo simulado`,
      });
  }
}
