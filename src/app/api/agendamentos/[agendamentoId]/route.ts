import { listarAgendaRoute, obterAgendamentoRoute, criarAgendamentoRoute, atualizarAgendamentoRoute, alterarStatusAgendamentoRoute, cancelarAgendamentoRoute, verificarConflitoAgendaRoute, horariosDisponiveisRoute } from '@/modules/scheduling/server/api/routes/agenda.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { agendamentoId: string } },
) {
  return obterAgendamentoRoute(request, { agendamentoId: params.agendamentoId });
}

export async function PUT(
  request: Request,
  { params }: { params: { agendamentoId: string } },
) {
  return atualizarAgendamentoRoute(request, { agendamentoId: params.agendamentoId });
}
