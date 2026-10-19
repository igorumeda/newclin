import { listarBloqueiosRoute, criarBloqueioRoute, removerBloqueioRoute } from '@/modules/scheduling/server/api/routes/bloqueio.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return listarBloqueiosRoute(request);
}

export async function POST(request: Request) {
  return criarBloqueioRoute(request);
}
