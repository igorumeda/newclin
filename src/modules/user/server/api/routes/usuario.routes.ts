import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import { getEnv } from '@/server/config/env.config';
import {
  atualizarUsuarioRequestSchema,
  criarUsuarioRequestSchema,
  listarUsuariosRequestSchema,
} from '../dtos/usuario.request.dto';

/** Gestão de usuários é exclusiva do Admin da Rede (§2.3). */
const GESTAO = ['admin_rede'] as const;

export async function listarUsuariosRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = listarUsuariosRequestSchema.parse(
        Object.fromEntries(query.entries()),
      );
      return controllers.usuario.handle({ action: 'listar', context, input });
    },
  });
}

export async function obterPerfilAtualRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'],
    handler: async ({ context }) =>
      controllers.usuario.handle({ action: 'perfil-atual', context }),
  });
}

export async function criarUsuarioRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'criar',
      entity: 'profiles',
      description: 'Convite de usuário da rede',
    },
    handler: async ({ context, body }) => {
      const input = criarUsuarioRequestSchema.parse(body);
      return controllers.usuario.handle({
        action: 'criar',
        context,
        input,
        appUrl: new URL('/convite', getEnv().NEXT_PUBLIC_APP_URL).toString(),
      });
    },
  });
}

export async function atualizarUsuarioRoute(
  request: Request,
  params: { usuarioId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'atualizar',
      entity: 'profiles',
      description: 'Alteração de usuário da rede',
    },
    handler: async ({ context, body }) => {
      const input = atualizarUsuarioRequestSchema.parse(body);
      return controllers.usuario.handle({
        action: 'atualizar',
        context,
        usuarioId: params.usuarioId,
        input,
      });
    },
  });
}

export async function inativarUsuarioRoute(
  request: Request,
  params: { usuarioId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'excluir',
      entity: 'profiles',
      description: 'Inativação de usuário da rede',
    },
    handler: async ({ context }) =>
      controllers.usuario.handle({
        action: 'inativar',
        context,
        usuarioId: params.usuarioId,
      }),
  });
}

export async function reativarUsuarioRoute(
  request: Request,
  params: { usuarioId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'atualizar',
      entity: 'profiles',
      description: 'Reativação de usuário da rede',
    },
    handler: async ({ context }) =>
      controllers.usuario.handle({
        action: 'reativar',
        context,
        usuarioId: params.usuarioId,
      }),
  });
}
