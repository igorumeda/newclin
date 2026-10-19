import { listarProfissionaisRoute, criarProfissionalRoute, atualizarProfissionalRoute, inativarProfissionalRoute, reativarProfissionalRoute, definirHorariosRoute, definirUnidadesProfissionalRoute } from '@/modules/professional/server/api/routes/profissional.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { profissionalId: string } },
) {
  return reativarProfissionalRoute(request, { profissionalId: params.profissionalId });
}
