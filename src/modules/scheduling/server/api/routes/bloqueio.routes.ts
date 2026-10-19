import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import { criarBloqueioRequestSchema, listarBloqueiosRequestSchema } from '../dtos/agenda.request.dto';

const LEITURA = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;
const GESTAO = ['admin_rede', 'gestor_unidade'] as const;

export async function listarBloqueiosRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...LEITURA],
    handler: async ({ context, query }) => {
      const input = listarBloqueiosRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.bloqueio.handle({ action: 'listar', context, input });
    },
  });
}

export async function criarBloqueioRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    audit: { action: 'criar', entity: 'bloqueios_agenda', description: 'Bloqueio de agenda' },
    handler: async ({ context, body }) => {
      const input = criarBloqueioRequestSchema.parse(body);
      return controllers.bloqueio.handle({ action: 'criar', context, input });
    },
  });
}

export async function removerBloqueioRoute(
  request: Request,
  params: { bloqueioId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'cancelar', entity: 'bloqueios_agenda', description: 'Remoção de bloqueio de agenda' },
    handler: async ({ context }) =>
      controllers.bloqueio.handle({ action: 'remover', context, bloqueioId: params.bloqueioId }),
  });
}
