import type { NextResponse } from 'next/server';
import { handleRoute } from '@/server/api/route-adapter';
import { lazyControllers } from '@/server/di/container';
import {
  atualizarPacienteRequestSchema,
  criarPacienteRequestSchema,
  importarPacientesRequestSchema,
  listarPacientesRequestSchema,
  verificarDuplicidadeRequestSchema,
} from '../dtos/paciente.request.dto';

const TODOS = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;
const CLINICO = ['admin_rede', 'gestor_unidade', 'profissional'] as const;
const GESTAO = ['admin_rede'] as const;

export async function listarPacientesRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    handler: async ({ context, query }) => {
      const input = listarPacientesRequestSchema.parse(Object.fromEntries(query.entries()));
      return controllers.paciente.handle({ action: 'listar', context, input });
    },
  });
}

export async function obterPacienteRoute(
  request: Request,
  params: { pacienteId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    audit: {
      action: 'ler',
      entity: 'pacientes',
      description: 'Consulta aos dados cadastrais do paciente',
    },
    handler: async ({ context }) =>
      controllers.paciente.handle({ action: 'obter', context, pacienteId: params.pacienteId }),
  });
}

export async function criarPacienteRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    audit: { action: 'criar', entity: 'pacientes', description: 'Cadastro de paciente' },
    handler: async ({ context, body }) => {
      const input = criarPacienteRequestSchema.parse(body);
      return controllers.paciente.handle({ action: 'criar', context, input });
    },
  });
}

export async function atualizarPacienteRoute(
  request: Request,
  params: { pacienteId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    audit: { action: 'atualizar', entity: 'pacientes', description: 'Atualização de paciente' },
    handler: async ({ context, body }) => {
      const input = atualizarPacienteRequestSchema.parse(body);
      return controllers.paciente.handle({
        action: 'atualizar',
        context,
        pacienteId: params.pacienteId,
        input,
      });
    },
  });
}

export async function inativarPacienteRoute(
  request: Request,
  params: { pacienteId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    audit: { action: 'excluir', entity: 'pacientes', description: 'Inativação de paciente (LGPD)' },
    handler: async ({ context }) =>
      controllers.paciente.handle({
        action: 'inativar',
        context,
        pacienteId: params.pacienteId,
        reativar: false,
      }),
  });
}

export async function reativarPacienteRoute(
  request: Request,
  params: { pacienteId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...TODOS],
    audit: { action: 'atualizar', entity: 'pacientes', description: 'Reativação de paciente' },
    handler: async ({ context }) =>
      controllers.paciente.handle({
        action: 'inativar',
        context,
        pacienteId: params.pacienteId,
        reativar: true,
      }),
  });
}

export async function verificarDuplicidadePacienteRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...TODOS],
    handler: async ({ context, body }) => {
      const input = verificarDuplicidadeRequestSchema.parse(body ?? {});
      return controllers.paciente.handle({ action: 'verificar-duplicidade', context, input });
    },
  });
}

export async function importarPacientesRoute(request: Request): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    allowedRoles: [...CLINICO],
    audit: {
      action: 'criar',
      entity: 'pacientes',
      description: 'Importação de pacientes via planilha',
    },
    handler: async ({ context, body }) => {
      const input = importarPacientesRequestSchema.parse(body);
      return controllers.paciente.handle({ action: 'importar', context, input });
    },
  });
}

export async function exportarDadosPacienteRoute(
  request: Request,
  params: { pacienteId: string },
): Promise<NextResponse> {
  const controllers = lazyControllers();
  return handleRoute({
    request,
    params,
    allowedRoles: [...GESTAO],
    audit: {
      action: 'exportar',
      entity: 'pacientes',
      description: 'Exportação dos dados do titular (LGPD)',
    },
    handler: async ({ context }) =>
      controllers.paciente.handle({
        action: 'exportar-dados',
        context,
        pacienteId: params.pacienteId,
      }),
  });
}
