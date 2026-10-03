import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

/** Trilha de auditoria — leitura restrita ao Admin da Rede (§2.3, §5). */
const GESTAO = ['admin_rede'] as const;

const auditoriaRequestSchema = z.object({
  entidade: z.string().trim().max(80).optional(),
  acao: z.string().trim().max(40).optional(),
  usuarioId: z.string().uuid().optional(),
  registroId: z.string().uuid().optional(),
  de: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
});

export async function GET(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();

  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = auditoriaRequestSchema.parse(Object.fromEntries(query.entries()));

      return controllers.auditoria.handle({
        action: 'listar',
        redeId: context.redeId,
        input: {
          entidade: input.entidade ?? null,
          acao: input.acao ?? null,
          usuarioId: input.usuarioId ?? null,
          registroId: input.registroId ?? null,
          dataInicio: input.de ?? null,
          dataFim: input.ate ?? null,
          page: input.page,
          perPage: input.perPage,
        },
      });
    },
  });
}
