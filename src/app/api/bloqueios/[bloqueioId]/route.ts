import { listarBloqueiosRoute, criarBloqueioRoute, removerBloqueioRoute } from '@/modules/scheduling/server/api/routes/bloqueio.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { bloqueioId: string } },
) {
  return removerBloqueioRoute(request, { bloqueioId: params.bloqueioId });
}
