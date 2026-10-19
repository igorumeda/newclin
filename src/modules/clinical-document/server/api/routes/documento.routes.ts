import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  atualizarDocumentoRequestSchema,
  cancelarDocumentoRequestSchema,
  criarDocumentoRequestSchema,
  emitirDocumentoRequestSchema,
  listarDocumentosRequestSchema,
  obterLinkDocumentoRequestSchema,
} from '../dtos/documento.request.dto';

/** Recepção participa apenas da declaração de comparecimento (§2.4). */
const TODOS = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;
const CLINICO = ['admin_rede', 'gestor_unidade', 'profissional'] as const;
const ENTIDADE = 'documentos';

export async function listarDocumentosRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    handler: async ({ context, query }) => {
      const input = listarDocumentosRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.documento.handle({ action: 'listar', context, input });
    },
  });
}

export async function previsualizarDocumentoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    handler: async ({ context, body }) => {
      const input = criarDocumentoRequestSchema.parse(body);
      return controllers.documento.handle({ action: 'previsualizar', context, input });
    },
  });
}

export async function criarDocumentoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    audit: { action: 'criar', entity: ENTIDADE, description: 'Rascunho de documento clínico' },
    handler: async ({ context, body }) => {
      const input = criarDocumentoRequestSchema.parse(body);
      return controllers.documento.handle({ action: 'criar', context, input });
    },
  });
}

export async function obterDocumentoRoute(
  request: Request,
  params: { documentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    handler: async ({ context }) =>
      controllers.documento.handle({ action: 'obter', context, documentoId: params.documentoId }),
  });
}

export async function atualizarDocumentoRoute(
  request: Request,
  params: { documentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    handler: async ({ context, body }) => {
      const input = atualizarDocumentoRequestSchema.parse(body);
      return controllers.documento.handle({
        action: 'atualizar',
        context,
        documentoId: params.documentoId,
        input,
      });
    },
  });
}

export async function emitirDocumentoRoute(
  request: Request,
  params: { documentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    audit: {
      action: 'atualizar',
      entity: ENTIDADE,
      description: 'Emissão de documento clínico em PDF',
    },
    handler: async ({ context, body }) => {
      const input = emitirDocumentoRequestSchema.parse(body ?? {});
      return controllers.documento.handle({
        action: 'emitir',
        context,
        documentoId: params.documentoId,
        input,
      });
    },
  });
}

export async function cancelarDocumentoRoute(
  request: Request,
  params: { documentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    audit: { action: 'atualizar', entity: ENTIDADE, description: 'Cancelamento de documento emitido' },
    handler: async ({ context, body }) => {
      const input = cancelarDocumentoRequestSchema.parse(body);
      return controllers.documento.handle({
        action: 'cancelar',
        context,
        documentoId: params.documentoId,
        input,
      });
    },
  });
}

export async function obterLinkDocumentoRoute(
  request: Request,
  params: { documentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    handler: async ({ context, query }) => {
      const input = obterLinkDocumentoRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.documento.handle({
        action: 'link',
        context,
        documentoId: params.documentoId,
        input,
      });
    },
  });
}
