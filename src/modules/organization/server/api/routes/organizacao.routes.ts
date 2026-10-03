/**
 * Rotas HTTP do módulo organização.
 * Cada função faz o parse do formato HTTP (Zod), delega ao controller e é
 * exportada pelos route handlers em `src/app/api/v1/**`.
 */
import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  atualizarOrganizacaoRequestSchema,
  atualizarTemaRequestSchema,
  atualizarUnidadeRequestSchema,
  criarUnidadeRequestSchema,
  listarUnidadesRequestSchema,
} from '../dtos/organizacao.request.dto';

const ADMIN = ['admin_rede'] as const;

export async function obterOrganizacaoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    handler: async ({ context }) => controllers.organizacao.handle({ action: 'obter', context }),
  });
}

export async function atualizarOrganizacaoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...ADMIN],
    audit: { action: 'atualizar', entity: 'redes', description: 'Atualização dos dados da rede' },
    handler: async ({ context, body }) => {
      const input = atualizarOrganizacaoRequestSchema.parse(body);
      return controllers.organizacao.handle({ action: 'atualizar', context, input });
    },
  });
}

export async function atualizarTemaRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...ADMIN],
    audit: { action: 'atualizar', entity: 'redes', description: 'Alteração do tema da rede' },
    handler: async ({ context, body }) => {
      const input = atualizarTemaRequestSchema.parse(body);
      return controllers.organizacao.handle({ action: 'atualizar-tema', context, input });
    },
  });
}

export async function definirLogotipoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...ADMIN],
    audit: { action: 'atualizar', entity: 'redes', description: 'Alteração do logotipo da rede' },
    handler: async ({ context }) => {
      const formData = await request.formData();
      const arquivo = formData.get('arquivo');
      const remover = formData.get('remover') === 'true';

      if (remover || !arquivo || typeof arquivo === 'string') {
        return controllers.organizacao.handle({
          action: 'definir-logotipo',
          context,
          input: { arquivo: null, remover },
        });
      }

      const buffer = new Uint8Array(await arquivo.arrayBuffer());
      return controllers.organizacao.handle({
        action: 'definir-logotipo',
        context,
        input: {
          arquivo: {
            nome: arquivo.name,
            mimeType: arquivo.type,
            tamanhoBytes: buffer.byteLength,
            conteudo: buffer,
          },
        },
      });
    },
  });
}

export async function listarUnidadesRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    handler: async ({ context, query }) => {
      const input = listarUnidadesRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.organizacao.handle({ action: 'listar-unidades', context, input });
    },
  });
}

export async function criarUnidadeRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...ADMIN],
    audit: { action: 'criar', entity: 'unidades', description: 'Criação de unidade' },
    handler: async ({ context, body }) => {
      const input = criarUnidadeRequestSchema.parse(body);
      return controllers.organizacao.handle({ action: 'criar-unidade', context, input });
    },
  });
}

export async function atualizarUnidadeRoute(
  request: Request,
  params: { unidadeId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...ADMIN, 'gestor_unidade'],
    audit: { action: 'atualizar', entity: 'unidades', description: 'Atualização de unidade' },
    handler: async ({ context, body }) => {
      const input = atualizarUnidadeRequestSchema.parse(body);
      return controllers.organizacao.handle({
        action: 'atualizar-unidade',
        context,
        unidadeId: params.unidadeId,
        input,
      });
    },
  });
}

export async function inativarUnidadeRoute(
  request: Request,
  params: { unidadeId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...ADMIN],
    audit: { action: 'cancelar', entity: 'unidades', description: 'Inativação de unidade' },
    handler: async ({ context }) =>
      controllers.organizacao.handle({
        action: 'inativar-unidade',
        context,
        unidadeId: params.unidadeId,
        reativar: false,
      }),
  });
}

export async function reativarUnidadeRoute(
  request: Request,
  params: { unidadeId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...ADMIN],
    audit: { action: 'atualizar', entity: 'unidades', description: 'Reativação de unidade' },
    handler: async ({ context }) =>
      controllers.organizacao.handle({
        action: 'inativar-unidade',
        context,
        unidadeId: params.unidadeId,
        reativar: true,
      }),
  });
}
