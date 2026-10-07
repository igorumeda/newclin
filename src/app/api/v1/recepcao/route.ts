import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { RecepcaoController } from '@/modules/agenda/server/api/controllers/recepcao.controller';

const handler = createRouteHandler({
  controller: (container) => new RecepcaoController({ painelRecepcao: container.painelRecepcao }),
});

export const GET = handler;
