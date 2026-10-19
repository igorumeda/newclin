import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  dashboardRequestSchema,
  relatorioRequestSchema,
  relatorioDistribuicaoRequestSchema,
} from '../dtos/relatorio.request.dto';

/** Relatórios são restritos a Admin da Rede e Gestor de Unidade (§3.8). */
const GESTAO = ['admin_rede', 'gestor_unidade'] as const;

export async function dashboardRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = dashboardRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'dashboard', context, unidadeId: input.unidadeId });
    },
  });
}

export async function relatorioAtendimentosRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = relatorioRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'atendimentos', context, input });
    },
  });
}

export async function relatorioFaltasRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = relatorioRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'faltas', context, input });
    },
  });
}

export async function relatorioNovosPacientesRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = relatorioRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'novos-pacientes', context, input });
    },
  });
}

export async function relatorioDistribuicaoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = relatorioDistribuicaoRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'distribuicao', context, input });
    },
  });
}

export async function relatorioProdutividadeRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    handler: async ({ context, query }) => {
      const input = relatorioRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'produtividade', context, input });
    },
  });
}

export async function relatorioVisaoGeralRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    audit: { action: 'exportar', entity: 'relatorios', description: 'Consulta consolidada de relatórios' },
    handler: async ({ context, query }) => {
      const input = relatorioRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.relatorio.handle({ action: 'visao-geral', context, input });
    },
  });
}
