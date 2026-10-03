import { checkInRoute } from '@/modules/scheduling/server/api/routes/recepcao.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { agendamentoId: string } },
) {
  return checkInRoute(request, { agendamentoId: params.agendamentoId });
}
