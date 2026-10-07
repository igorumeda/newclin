import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { NotificacaoController } from '@/modules/notificacao/server/api/controllers/notificacao.controller';

const handler = createRouteHandler({
  controller: (container) => new NotificacaoController({
      listarNotificacoes: container.listarNotificacoes,
      agendarNotificacao: container.agendarNotificacao,
    }),
  auditoria: { entidade: 'notificacao' },
});

export const GET = handler;
export const POST = handler;
