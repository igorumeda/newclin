import type { SmtpConfig, WhatsAppConfig } from '@/server/config/env.config';
import type { IEmailProvider } from '../../../domain/services/email-provider.interface';
import type { IWhatsAppProvider } from '../../../domain/services/whatsapp-provider.interface';
import { LogEmailProvider } from './log-email.provider';
import { LogWhatsAppProvider } from './log-whatsapp.provider';
import { MetaWhatsAppProvider } from './meta-whatsapp.provider';
import { SmtpEmailProvider } from './smtp-email.provider';
import { ZapiWhatsAppProvider } from './zapi-whatsapp.provider';

export type CreateEmailProviderParams = { config: SmtpConfig };
export type CreateWhatsAppProviderParams = { config: WhatsAppConfig };

export function createEmailProvider({ config }: CreateEmailProviderParams): IEmailProvider {
  if (config.driver !== 'smtp' || !config.host) return new LogEmailProvider();
  return new SmtpEmailProvider({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    password: config.password,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
  });
}

export function createWhatsAppProvider({
  config,
}: CreateWhatsAppProviderParams): IWhatsAppProvider {
  if (config.provider === 'meta' && config.meta.accessToken) {
    return new MetaWhatsAppProvider({
      phoneNumberId: config.meta.phoneNumberId,
      accessToken: config.meta.accessToken,
      apiVersion: config.meta.apiVersion,
    });
  }
  if (config.provider === 'zapi' && config.zapi.instanceId) {
    return new ZapiWhatsAppProvider({
      baseUrl: config.zapi.baseUrl,
      instanceId: config.zapi.instanceId,
      token: config.zapi.token,
      clientToken: config.zapi.clientToken,
    });
  }
  return new LogWhatsAppProvider();
}
