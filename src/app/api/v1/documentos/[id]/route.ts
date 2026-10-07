import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { DocumentoController } from '@/modules/documento/server/api/controllers/documento.controller';

const handler = createRouteHandler({
  controller: (container) => new DocumentoController({
      listarDocumentos: container.listarDocumentos,
      obterDocumento: container.obterDocumento,
      criarDocumento: container.criarDocumento,
      emitirDocumento: container.emitirDocumento,
    }),
  auditoria: { entidade: 'documento' },
});

export const GET = handler;
