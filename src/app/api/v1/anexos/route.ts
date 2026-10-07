import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { AnexoController } from '@/modules/prontuario/server/api/controllers/anexo.controller';

const handler = createRouteHandler({
  controller: (container) => new AnexoController({
      listarAnexos: container.listarAnexos,
      registrarAnexo: container.registrarAnexo,
      removerAnexo: container.removerAnexo,
    }),
  auditoria: { entidade: 'anexo' },
});

export const GET = handler;
export const POST = handler;
