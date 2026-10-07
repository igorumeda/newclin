import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { WebhookWhatsAppController } from '@/modules/notificacao/server/api/controllers/webhook-whatsapp.controller';

const handler = createRouteHandler({
  controller: (container) => new WebhookWhatsAppController({
      processarWebhookWhatsApp: container.processarWebhookWhatsApp,
      verifyToken: container.config.whatsapp.webhookVerifyToken,
    }),
  publica: true,
});

export const GET = handler;
export const POST = handler;
