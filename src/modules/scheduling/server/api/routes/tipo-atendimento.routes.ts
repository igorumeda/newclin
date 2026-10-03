import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  atualizarTipoAtendimentoRequestSchema,
  criarTipoAtendimentoRequestSchema,
  listarTiposAtendimentoRequestSchema,
} from '../dtos/agenda.request.dto';

const LEITURA = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;
const GESTAO = ['admin_rede'] as const;

export async function listarTiposAtendimentoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...LEITURA],
    handler: async ({ context, query }) => {
      const input = listarTiposAtendimentoRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.tiposAtendimento.handle({ action: 'listar', context, input });
    },
  });
}

export async function criarTipoAtendimentoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    audit: { action: 'criar', entity: 'tipos_atendimento', description: 'Novo tipo de atendimento' },
    handler: async ({ context, body }) => {
      const input = criarTipoAtendimentoRequestSchema.parse(body);
      return controllers.tiposAtendimento.handle({ action: 'criar', context, input });
    },
  });
}

export async function atualizarTipoAtendimentoRoute(
  request: Request,
  params: { tipoAtendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: 'tipos_atendimento', description: 'Alteração de tipo de atendimento' },
    handler: async ({ context, body }) => {
      const input = atualizarTipoAtendimentoRequestSchema.parse(body);
      return controllers.tiposAtendimento.handle({
        action: 'atualizar',
        context,
        tipoAtendimentoId: params.tipoAtendimentoId,
        input,
      });
    },
  });
}

export async function inativarTipoAtendimentoRoute(
  request: Request,
  params: { tipoAtendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'cancelar', entity: 'tipos_atendimento', description: 'Inativação de tipo de atendimento' },
    handler: async ({ context }) =>
      controllers.tiposAtendimento.handle({
        action: 'inativar',
        context,
        tipoAtendimentoId: params.tipoAtendimentoId,
        reativar: false,
      }),
  });
}

export async function reativarTipoAtendimentoRoute(
  request: Request,
  params: { tipoAtendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: 'tipos_atendimento', description: 'Reativação de tipo de atendimento' },
    handler: async ({ context }) =>
      controllers.tiposAtendimento.handle({
        action: 'inativar',
        context,
        tipoAtendimentoId: params.tipoAtendimentoId,
        reativar: true,
      }),
  });
}
