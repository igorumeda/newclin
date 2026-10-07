import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { AuditoriaController } from '@/modules/auditoria/server/api/controllers/auditoria.controller';

const handler = createRouteHandler({
  controller: (container) => new AuditoriaController({
      listarAuditoria: container.listarAuditoria,
      listarAcessosProntuario: container.listarAcessosProntuario,
    }),
  permissao: 'auditoria:ler',
});

export const GET = handler;
