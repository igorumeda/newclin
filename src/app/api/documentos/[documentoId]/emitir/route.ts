import { listarDocumentosRoute, previsualizarDocumentoRoute, criarDocumentoRoute, obterDocumentoRoute, atualizarDocumentoRoute, emitirDocumentoRoute, cancelarDocumentoRoute, obterLinkDocumentoRoute } from '@/modules/clinical-document/server/api/routes/documento.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { documentoId: string } },
) {
  return emitirDocumentoRoute(request, { documentoId: params.documentoId });
}
