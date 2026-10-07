import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { PacienteController } from '@/modules/paciente/server/api/controllers/paciente.controller';

const handler = createRouteHandler({
  controller: (container) => new PacienteController({
      listarPacientes: container.listarPacientes,
      obterPaciente: container.obterPaciente,
      criarPaciente: container.criarPaciente,
      atualizarPaciente: container.atualizarPaciente,
      alternarStatusPaciente: container.alternarStatusPaciente,
      exportarPaciente: container.exportarPaciente,
    }),
  auditoria: { entidade: 'paciente' },
});

export const GET = handler;
export const POST = handler;
