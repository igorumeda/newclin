import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { RelatorioController } from '@/modules/relatorio/server/api/controllers/relatorio.controller';

const handler = createRouteHandler({
  controller: (container) => new RelatorioController({
      obterIndicadores: container.obterIndicadores,
      relatorioAtendimentos: container.relatorioAtendimentos,
      relatorioFaltas: container.relatorioFaltas,
      relatorioNovosPacientes: container.relatorioNovosPacientes,
      relatorioProdutividade: container.relatorioProdutividade,
    }),
});

export const GET = handler;
