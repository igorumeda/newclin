import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  atualizarTemplateRequestSchema,
  clonarTemplateRequestSchema,
  criarTemplateRequestSchema,
  inativarTemplateRequestSchema,
  listarTemplatesRequestSchema,
} from '../dtos/prontuario.request.dto';

const CLINICO = ['admin_rede', 'gestor_unidade', 'profissional'] as const;
const GESTAO = ['admin_rede'] as const;

const ENTIDADE = 'templates_prontuario';

export async function listarTemplatesRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO],
    handler: async ({ context, query }) => {
      const input = listarTemplatesRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.template.handle({ action: 'listar', context, input });
    },
  });
}

export async function obterTemplateRoute(
  request: Request,
  params: { templateId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    handler: async ({ context }) =>
      controllers.template.handle({ action: 'obter', context, templateId: params.templateId }),
  });
}

export async function criarTemplateRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...GESTAO],
    audit: { action: 'criar', entity: ENTIDADE, description: 'Novo template de prontuário' },
    handler: async ({ context, body }) => {
      const input = criarTemplateRequestSchema.parse(body);
      return controllers.template.handle({ action: 'criar', context, input });
    },
  });
}

export async function clonarTemplateRoute(
  request: Request,
  params: { templateId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'criar', entity: ENTIDADE, description: 'Clonagem de template de prontuário' },
    handler: async ({ context, body }) => {
      const input = clonarTemplateRequestSchema.parse(body);
      return controllers.template.handle({
        action: 'clonar',
        context,
        templateId: params.templateId,
        input,
      });
    },
  });
}

export async function atualizarTemplateRoute(
  request: Request,
  params: { templateId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: ENTIDADE, description: 'Alteração de template de prontuário' },
    handler: async ({ context, body }) => {
      const input = atualizarTemplateRequestSchema.parse(body);
      return controllers.template.handle({
        action: 'atualizar',
        context,
        templateId: params.templateId,
        input,
      });
    },
  });
}

export async function inativarTemplateRoute(
  request: Request,
  params: { templateId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: ENTIDADE, description: 'Inativação de template de prontuário' },
    handler: async ({ context, body }) => {
      const input = inativarTemplateRequestSchema.parse(body ?? {});
      return controllers.template.handle({
        action: 'inativar',
        context,
        templateId: params.templateId,
        reativar: input.reativar ?? false,
      });
    },
  });
}

export async function reativarTemplateRoute(
  request: Request,
  params: { templateId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: { action: 'atualizar', entity: ENTIDADE, description: 'Reativação de template de prontuário' },
    handler: async ({ context }) =>
      controllers.template.handle({
        action: 'inativar',
        context,
        templateId: params.templateId,
        reativar: true,
      }),
  });
}
