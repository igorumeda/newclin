import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { BloqueioController } from '@/modules/agenda/server/api/controllers/bloqueio.controller';

const handler = createRouteHandler({
  controller: (container) => new BloqueioController({
      listarBloqueios: container.listarBloqueios,
      criarBloqueio: container.criarBloqueio,
      removerBloqueio: container.removerBloqueio,
    }),
  auditoria: { entidade: 'bloqueio_agenda' },
});

export const GET = handler;
export const POST = handler;
