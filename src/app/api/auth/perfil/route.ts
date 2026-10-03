import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

const TODOS = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;

/** GET /api/auth/perfil — perfil do usuário autenticado + permissões efetivas. */
export async function GET(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();

  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    handler: async ({ context }) => controllers.usuario.handle({ action: 'perfil-atual', context }),
  });
}
