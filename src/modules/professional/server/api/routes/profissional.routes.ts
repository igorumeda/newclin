import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  atualizarProfissionalRequestSchema,
  criarProfissionalRequestSchema,
  definirHorariosRequestSchema,
  definirUnidadesProfissionalRequestSchema,
  listarProfissionaisRequestSchema,
} from '../dtos/profissional.request.dto';

const GESTAO = ['admin_rede'] as const;
const LEITURA = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;

export async function listarProfissionaisRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...LEITURA],
    handler: async ({ context, query }) => {
      const input = listarProfissionaisRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.profissional.handle({ action: 'listar', context, input });
    },
  });
}

export async function criarProfissionalRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    audit: { action: 'criar', entity: 'profissionais', description: 'Cadastro de profissional' },
    handler: async ({ context, body }) => {
      const input = criarProfissionalRequestSchema.parse(body);
      return controllers.profissional.handle({ action: 'criar', context, input });
    },
  });
}

export async function atualizarProfissionalRoute(
  request: Request,
  params: { profissionalId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: 'profissionais', description: 'Atualização de profissional' },
    handler: async ({ context, body }) => {
      const input = atualizarProfissionalRequestSchema.parse(body);
      return controllers.profissional.handle({
        action: 'atualizar',
        context,
        profissionalId: params.profissionalId,
        input,
      });
    },
  });
}

export async function inativarProfissionalRoute(
  request: Request,
  params: { profissionalId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'cancelar', entity: 'profissionais', description: 'Inativação de profissional' },
    handler: async ({ context }) =>
      controllers.profissional.handle({
        action: 'inativar',
        context,
        profissionalId: params.profissionalId,
        reativar: false,
      }),
  });
}

export async function reativarProfissionalRoute(
  request: Request,
  params: { profissionalId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: 'profissionais', description: 'Reativação de profissional' },
    handler: async ({ context }) =>
      controllers.profissional.handle({
        action: 'inativar',
        context,
        profissionalId: params.profissionalId,
        reativar: true,
      }),
  });
}

export async function definirHorariosRoute(
  request: Request,
  params: { profissionalId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'atualizar',
      entity: 'horarios_atendimento',
      description: 'Definição da grade de horários',
    },
    handler: async ({ context, body }) => {
      const input = definirHorariosRequestSchema.parse(body);
      return controllers.profissional.handle({
        action: 'definir-horarios',
        context,
        profissionalId: params.profissionalId,
        input,
      });
    },
  });
}

export async function definirUnidadesProfissionalRoute(
  request: Request,
  params: { profissionalId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'atualizar',
      entity: 'profissional_unidades',
      description: 'Definição das unidades de atuação',
    },
    handler: async ({ context, body }) => {
      const input = definirUnidadesProfissionalRequestSchema.parse(body);
      return controllers.profissional.handle({
        action: 'definir-unidades',
        context,
        profissionalId: params.profissionalId,
        input,
      });
    },
  });
}
