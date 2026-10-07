import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { TipoAtendimentoController } from '@/modules/agenda/server/api/controllers/tipo-atendimento.controller';

const handler = createRouteHandler({
  controller: (container) => new TipoAtendimentoController({
      listarTiposAtendimento: container.listarTiposAtendimento,
      criarTipoAtendimento: container.criarTipoAtendimento,
      atualizarTipoAtendimento: container.atualizarTipoAtendimento,
    }),
  auditoria: { entidade: 'tipo_atendimento' },
});

export const GET = handler;
export const POST = handler;
