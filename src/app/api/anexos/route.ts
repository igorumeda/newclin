import { listarAnexosRoute, enviarAnexoRoute, obterLinkAnexoRoute, removerAnexoRoute } from '@/modules/medical-record/server/api/routes/anexo.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return listarAnexosRoute(request);
}

export async function POST(request: Request) {
  return enviarAnexoRoute(request);
}
