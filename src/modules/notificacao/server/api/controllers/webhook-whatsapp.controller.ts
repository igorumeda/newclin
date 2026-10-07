import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { ProcessarWebhookWhatsAppUseCase } from '../../../application/use-cases/processar-webhook-whatsapp/processar-webhook-whatsapp.use-case';

export type WebhookWhatsAppControllerDependencies = {
  processarWebhookWhatsApp: ProcessarWebhookWhatsAppUseCase;
  verifyToken: string;
};

/** Rota pública chamada pelo provedor de WhatsApp (spec §4.2). */
export class WebhookWhatsAppController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly processarWebhookWhatsApp: ProcessarWebhookWhatsAppUseCase;
  private readonly verifyToken: string;

  constructor(dependencies: WebhookWhatsAppControllerDependencies) {
    super();
    this.processarWebhookWhatsApp = dependencies.processarWebhookWhatsApp;
    this.verifyToken = dependencies.verifyToken;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (request.method === 'GET') return this.verificar(request);
    if (request.method === 'POST') return this.receber(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  /** Handshake de verificação exigido pela Meta Cloud API. */
  private async verificar(request: HttpRequest): Promise<HttpResponsePayload> {
    const token = textoQuery({ query: request.query, chave: 'hub.verify_token' });
    const challenge = textoQuery({ query: request.query, chave: 'hub.challenge' });
    if (token !== this.verifyToken) return HttpResponse.forbidden();
    return HttpResponse.ok({ data: challenge ?? '' });
  }

  private async receber(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.processarWebhookWhatsApp.execute({ payload: request.body });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
