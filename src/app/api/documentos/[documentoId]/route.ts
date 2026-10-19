import { listarDocumentosRoute, previsualizarDocumentoRoute, criarDocumentoRoute, obterDocumentoRoute, atualizarDocumentoRoute, emitirDocumentoRoute, cancelarDocumentoRoute, obterLinkDocumentoRoute } from '@/modules/clinical-document/server/api/routes/documento.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { documentoId: string } },
) {
  return obterDocumentoRoute(request, { documentoId: params.documentoId });
}

export async function PUT(
  request: Request,
  { params }: { params: { documentoId: string } },
) {
  return atualizarDocumentoRoute(request, { documentoId: params.documentoId });
}
