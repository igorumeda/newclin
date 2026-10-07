import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { UnidadeController } from '@/modules/unidade/server/api/controllers/unidade.controller';

const handler = createRouteHandler({
  controller: (container) => new UnidadeController({
      listarUnidades: container.listarUnidades,
      criarUnidade: container.criarUnidade,
      atualizarUnidade: container.atualizarUnidade,
      alternarStatusUnidade: container.alternarStatusUnidade,
    }),
  auditoria: { entidade: 'unidade' },
});

export const GET = handler;
export const POST = handler;
