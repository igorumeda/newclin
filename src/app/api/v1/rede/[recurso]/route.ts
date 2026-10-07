import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { RedeController } from '@/modules/rede/server/api/controllers/rede.controller';

const handler = createRouteHandler({
  controller: (container) => new RedeController({
      obterRede: container.obterRede,
      atualizarRede: container.atualizarRede,
      atualizarTema: container.atualizarTema,
    }),
  auditoria: { entidade: 'rede' },
});

export const PATCH = handler;
