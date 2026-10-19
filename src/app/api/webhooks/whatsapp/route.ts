import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import { verificarWebhookWhatsappRoute } from '@/modules/notification/server/api/routes/notificacao.routes';
import { getEnv } from '@/server/config/env.config';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

function safeParse(valor: string): unknown {
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

/** GET — verificação do webhook pela Meta (hub.challenge). */
export async function GET(request: Request): Promise<NextResponse> {
  return verificarWebhookWhatsappRoute(request);
}

/**
 * POST — mensagens/reações dos pacientes. O corpo é lido aqui e repassado ao
 * caso de uso junto com a assinatura, pois o handler não pode consumir duas vezes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const payloadBruto = await request.text();
  const assinatura = request.headers.get('x-hub-signature-256');
  const controllers = lazyControllers();

  return handleRoute({
    request,
    allowedRoles: ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'],
    requireAuth: false,
    publicRoute: true,
    handler: async ({ context }) =>
      controllers.notificacao.handle({
        action: 'webhook',
        context,
        input: {
          payloadBruto,
          assinatura,
          payload: payloadBruto ? safeParse(payloadBruto) : null,
        },
      }),
  });
}
