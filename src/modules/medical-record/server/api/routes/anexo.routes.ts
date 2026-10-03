import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  enviarAnexoRequestSchema,
  listarAnexosRequestSchema,
  obterLinkAnexoRequestSchema,
} from '../dtos/prontuario.request.dto';

const CLINICO = ['admin_rede', 'gestor_unidade', 'profissional'] as const;

export async function listarAnexosRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO],
    handler: async ({ context, query }) => {
      const input = listarAnexosRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.anexo.handle({ action: 'listar', context, input });
    },
  });
}

export async function enviarAnexoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO],
    audit: { action: 'criar', entity: 'anexos', description: 'Anexo enviado ao prontuário' },
    handler: async ({ context, body }) => {
      const input = enviarAnexoRequestSchema.parse(body);
      return controllers.anexo.handle({ action: 'enviar', context, input });
    },
  });
}

export async function obterLinkAnexoRoute(
  request: Request,
  params: { anexoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    handler: async ({ query }) => {
      const input = obterLinkAnexoRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.anexo.handle({ action: 'link', anexoId: params.anexoId, input });
    },
  });
}

export async function removerAnexoRoute(
  request: Request,
  params: { anexoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    audit: { action: 'excluir', entity: 'anexos', description: 'Remoção de anexo do prontuário' },
    handler: async () => controllers.anexo.handle({ action: 'remover', anexoId: params.anexoId }),
  });
}
