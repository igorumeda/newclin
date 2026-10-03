import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  adicionarAdendoRequestSchema,
  cancelarAtendimentoRequestSchema,
  iniciarAtendimentoRequestSchema,
  listarAtendimentosRequestSchema,
  salvarRascunhoRequestSchema,
} from '../dtos/prontuario.request.dto';

/** Prontuário é restrito a perfis clínicos — recepção não acessa conteúdo clínico. */
const CLINICO = ['admin_rede', 'gestor_unidade', 'profissional'] as const;
const ENTIDADE = 'atendimentos';

export async function listarAtendimentosRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO],
    handler: async ({ context, query }) => {
      const input = listarAtendimentosRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.atendimento.handle({ action: 'listar', context, input });
    },
  });
}

export async function iniciarAtendimentoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO],
    audit: { action: 'criar', entity: ENTIDADE, description: 'Abertura de atendimento no prontuário' },
    handler: async ({ context, body }) => {
      const input = iniciarAtendimentoRequestSchema.parse(body);
      return controllers.atendimento.handle({ action: 'iniciar', context, input });
    },
  });
}

export async function obterAtendimentoRoute(
  request: Request,
  params: { atendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    audit: { action: 'ler', entity: ENTIDADE, description: 'Leitura do prontuário do paciente' },
    handler: async ({ context }) =>
      controllers.atendimento.handle({ action: 'obter', context, atendimentoId: params.atendimentoId }),
  });
}

export async function listarEvolucoesRoute(
  request: Request,
  params: { atendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    handler: async ({ context }) =>
      controllers.atendimento.handle({
        action: 'listar-evolucoes',
        context,
        atendimentoId: params.atendimentoId,
      }),
  });
}

export async function salvarRascunhoAtendimentoRoute(
  request: Request,
  params: { atendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    handler: async ({ context, body }) => {
      const input = salvarRascunhoRequestSchema.parse(body ?? {});
      return controllers.atendimento.handle({
        action: 'salvar-rascunho',
        context,
        atendimentoId: params.atendimentoId,
        input,
      });
    },
  });
}

export async function finalizarAtendimentoRoute(
  request: Request,
  params: { atendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    audit: {
      action: 'atualizar',
      entity: ENTIDADE,
      description: 'Finalização do atendimento — prontuário passa a ser imutável',
    },
    handler: async ({ context }) =>
      controllers.atendimento.handle({ action: 'finalizar', context, atendimentoId: params.atendimentoId }),
  });
}

export async function cancelarAtendimentoRoute(
  request: Request,
  params: { atendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    audit: { action: 'atualizar', entity: ENTIDADE, description: 'Cancelamento de atendimento' },
    handler: async ({ context, body }) => {
      const input = cancelarAtendimentoRequestSchema.parse(body);
      return controllers.atendimento.handle({
        action: 'cancelar',
        context,
        atendimentoId: params.atendimentoId,
        input,
      });
    },
  });
}

export async function adicionarAdendoRoute(
  request: Request,
  params: { atendimentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO],
    audit: { action: 'criar', entity: 'evolucoes', description: 'Adendo registrado no prontuário' },
    handler: async ({ context, body }) => {
      const input = adicionarAdendoRequestSchema.parse(body);
      return controllers.atendimento.handle({
        action: 'adicionar-adendo',
        context,
        atendimentoId: params.atendimentoId,
        input,
      });
    },
  });
}
