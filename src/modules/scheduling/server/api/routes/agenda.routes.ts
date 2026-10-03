import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  alterarStatusRequestSchema,
  atualizarAgendamentoRequestSchema,
  cancelarAgendamentoRequestSchema,
  criarAgendamentoRequestSchema,
  horariosDisponiveisRequestSchema,
  listarAgendaRequestSchema,
  verificarConflitoRequestSchema,
} from '../dtos/agenda.request.dto';

const EQUIPE = ['admin_rede', 'gestor_unidade', 'recepcao'] as const;
const CLINICO = ['admin_rede', 'gestor_unidade', 'profissional'] as const;

export async function listarAgendaRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO, 'recepcao'],
    handler: async ({ context, query }) => {
      const input = listarAgendaRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.agenda.handle({ action: 'listar', context, input });
    },
  });
}

export async function obterAgendamentoRoute(
  request: Request,
  params: { agendamentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO, 'recepcao'],
    handler: async ({ context }) =>
      controllers.agenda.handle({ action: 'obter', context, agendamentoId: params.agendamentoId }),
  });
}

export async function criarAgendamentoRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO, 'recepcao'],
    audit: { action: 'criar', entity: 'agendamentos', description: 'Novo agendamento' },
    handler: async ({ context, body }) => {
      const input = criarAgendamentoRequestSchema.parse(body);
      return controllers.agenda.handle({ action: 'criar', context, input });
    },
  });
}

export async function atualizarAgendamentoRoute(
  request: Request,
  params: { agendamentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO, 'recepcao'],
    audit: { action: 'atualizar', entity: 'agendamentos', description: 'Atualização de agendamento' },
    handler: async ({ context, body }) => {
      const input = atualizarAgendamentoRequestSchema.parse(body);
      return controllers.agenda.handle({
        action: 'atualizar',
        context,
        agendamentoId: params.agendamentoId,
        input,
      });
    },
  });
}

export async function alterarStatusAgendamentoRoute(
  request: Request,
  params: { agendamentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...CLINICO, 'recepcao'],
    audit: { action: 'atualizar', entity: 'agendamentos', description: 'Alteração de status do agendamento' },
    handler: async ({ context, body }) => {
      const input = alterarStatusRequestSchema.parse(body);
      return controllers.agenda.handle({
        action: 'alterar-status',
        context,
        agendamentoId: params.agendamentoId,
        input,
      });
    },
  });
}

export async function cancelarAgendamentoRoute(
  request: Request,
  params: { agendamentoId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...EQUIPE],
    audit: { action: 'cancelar', entity: 'agendamentos', description: 'Cancelamento de agendamento' },
    handler: async ({ context, body }) => {
      const input = cancelarAgendamentoRequestSchema.parse(body);
      return controllers.agenda.handle({
        action: 'cancelar',
        context,
        agendamentoId: params.agendamentoId,
        input,
      });
    },
  });
}

export async function verificarConflitoAgendaRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...EQUIPE, 'profissional'],
    handler: async ({ context, body }) => {
      const input = verificarConflitoRequestSchema.parse(body);
      return controllers.agenda.handle({ action: 'verificar-conflito', context, input });
    },
  });
}

export async function horariosDisponiveisRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...EQUIPE, 'profissional'],
    handler: async ({ context, query }) => {
      const input = horariosDisponiveisRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.agenda.handle({ action: 'horarios-disponiveis', context, input });
    },
  });
}
