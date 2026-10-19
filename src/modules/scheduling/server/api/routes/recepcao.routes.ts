import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import { painelRecepcaoRequestSchema } from '../dtos/agenda.request.dto';

const RECEPCAO = ['admin_rede', 'gestor_unidade', 'recepcao'] as const;

export async function painelRecepcaoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...RECEPCAO],
    handler: async ({ context, query }) => {
      const input = painelRecepcaoRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.recepcao.handle({ action: 'painel', context, input });
    },
  });
}

export async function checkInRoute(
  request: Request,
  params: { agendamentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...RECEPCAO],
    audit: { action: 'atualizar', entity: 'agendamentos', description: 'Check-in na recepção' },
    handler: async ({ context }) =>
      controllers.recepcao.handle({
        action: 'check-in',
        context,
        agendamentoId: params.agendamentoId,
      }),
  });
}
