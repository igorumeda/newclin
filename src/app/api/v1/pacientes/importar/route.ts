import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { ImportacaoPacientesController } from '@/modules/paciente/server/api/controllers/importacao-pacientes.controller';

const handler = createRouteHandler({
  controller: (container) => new ImportacaoPacientesController({ importarPacientes: container.importarPacientes }),
  auditoria: { entidade: 'importacao_pacientes' },
});

export const POST = handler;
