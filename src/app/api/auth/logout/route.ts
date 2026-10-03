import { NextResponse } from 'next/server';
import { createRouteClient } from '@/server/config/supabase.config';
import { HttpResponse } from '@/server/api/http-response';
import { mapError } from '@/server/middlewares/error.middleware';
import { authenticate } from '@/server/middlewares/auth.middleware';
import { getContainer, lazyControllers } from '@/server/di/container';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

/** POST /api/auth/logout — encerra a sessão e registra a saída na auditoria. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const contexto = await authenticate({ ip, userAgent: request.headers.get('user-agent') });

    const supabase = createRouteClient();
    await supabase.auth.signOut();

    if (!contexto.isFailure) {
      await getContainer().auditRecorder({
        context: contexto.value,
        options: { action: 'logout', entity: 'auth', description: 'Saída do sistema' },
        response: HttpResponse.ok({ sucesso: true }),
      });
    }

    return HttpResponse.ok({ sucesso: true }).toNextResponse();
  } catch (error) {
    return mapError(error).response.toNextResponse();
  }
}
