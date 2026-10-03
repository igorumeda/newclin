import { listarAgendaRoute, obterAgendamentoRoute, criarAgendamentoRoute, atualizarAgendamentoRoute, alterarStatusAgendamentoRoute, cancelarAgendamentoRoute, verificarConflitoAgendaRoute, horariosDisponiveisRoute } from '@/modules/scheduling/server/api/routes/agenda.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { agendamentoId: string } },
) {
  return alterarStatusAgendamentoRoute(request, { agendamentoId: params.agendamentoId });
}
