import { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { HttpResponse } from '@/server/api/http-response';
import { lazyControllers } from '@/server/di/container';
import { getEnv } from '@/server/config/env.config';
import {
  enfileirarLembretesRequestSchema,
  listarNotificacoesRequestSchema,
  processarFilaRequestSchema,
  salvarModeloMensagemRequestSchema,
} from '../dtos/notificacao.request.dto';

const GESTAO = ['admin_rede', 'gestor_unidade'] as const;

function isCronAutorizado(request: Request): boolean {
  const secret = getEnv().CRON_SECRET;
  if (!secret) return true;

  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

export async function listarNotificacoesRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = listarNotificacoesRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.notificacao.handle({ action: 'listar', context, input });
    },
  });
}

export async function listarModelosMensagemRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context }) => controllers.notificacao.handle({ action: 'listar-modelos', context }),
  });
}

export async function salvarModeloMensagemRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: ['admin_rede'],
    audit: { action: 'atualizar', entity: 'modelos_mensagem', description: 'Modelo de mensagem atualizado' },
    handler: async ({ context, body }) => {
      const input = salvarModeloMensagemRequestSchema.parse(body);
      return controllers.notificacao.handle({ action: 'salvar-modelo', context, input });
    },
  });
}

export async function reenviarNotificacaoRoute(
  request: Request,
  params: { notificacaoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'processar', entity: 'notificacoes', description: 'Reenvio manual de notificação' },
    handler: async ({ context }) =>
      controllers.notificacao.handle({ action: 'reenviar', context, notificacaoId: params.notificacaoId }),
  });
}

/** Worker da fila — chamado pelo cron (Vercel Cron, GitHub Actions ou agendador externo). */
export async function processarFilaNotificacoesRoute(request: Request): Promise<NextResponse> {
  if (!isCronAutorizado(request)) {
    return HttpResponse.unauthorized('Credencial de cron inválida').toNextResponse();
  }

  const controllers = lazyControllers();
  return handleRoute({
    request,
    publicRoute: true,
    handler: async ({ context, body }) => {
      const input = processarFilaRequestSchema.parse(body ?? {});
      return controllers.notificacao.handle({ action: 'processar-fila', context, input });
    },
  });
}

/** Dispara os lembretes de 24h (idempotente: ignora agendamentos já notificados). */
export async function enfileirarLembretesRoute(request: Request): Promise<NextResponse> {
  if (!isCronAutorizado(request)) {
    return HttpResponse.unauthorized('Credencial de cron inválida').toNextResponse();
  }

  const controllers = lazyControllers();
  return handleRoute({
    request,
    publicRoute: true,
    handler: async ({ context, body }) => {
      const input = enfileirarLembretesRequestSchema.parse(body ?? {});
      return controllers.notificacao.handle({ action: 'enfileirar-lembretes', context, input });
    },
  });
}

/** Verificação do webhook do WhatsApp (GET hub.challenge da Meta). */
export async function verificarWebhookWhatsappRoute(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const modo = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const esperado = getEnv().WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (modo === 'subscribe' && esperado && token === esperado && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  }

  return HttpResponse.forbidden('Verificação de webhook inválida').toNextResponse();
}

/** Recebe respostas e atualizações de status do provedor de WhatsApp. */
export async function webhookWhatsappRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  const payloadBruto = await request.text();

  return handleRoute({
    request,
    publicRoute: true,
    handler: async ({ context }) => {
      let payload: unknown = null;
      try {
        payload = payloadBruto ? JSON.parse(payloadBruto) : null;
      } catch {
        payload = null;
      }

      return controllers.notificacao.handle({
        action: 'webhook',
        context,
        input: {
          payload,
          payloadBruto,
          assinatura: request.headers.get('x-hub-signature-256'),
        },
      });
    },
  });
}
