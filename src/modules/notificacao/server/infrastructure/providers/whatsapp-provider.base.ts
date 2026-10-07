import type {
  EnviarWhatsAppParams,
  EventoWebhookWhatsApp,
  InterpretarWebhookParams,
  IWhatsAppProvider,
  ResultadoEnvioWhatsApp,
} from '../../../domain/services/whatsapp-provider.interface';

export abstract class WhatsAppProvider implements IWhatsAppProvider {
  abstract readonly nome: string;
  abstract enviar(params: EnviarWhatsAppParams): Promise<ResultadoEnvioWhatsApp>;
  abstract interpretarWebhook(params: InterpretarWebhookParams): EventoWebhookWhatsApp[];
}
