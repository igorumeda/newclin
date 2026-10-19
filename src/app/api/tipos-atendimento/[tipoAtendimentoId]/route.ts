import { listarTiposAtendimentoRoute, criarTipoAtendimentoRoute, atualizarTipoAtendimentoRoute, inativarTipoAtendimentoRoute, reativarTipoAtendimentoRoute } from '@/modules/scheduling/server/api/routes/tipo-atendimento.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { tipoAtendimentoId: string } },
) {
  return atualizarTipoAtendimentoRoute(request, { tipoAtendimentoId: params.tipoAtendimentoId });
}

export async function DELETE(
  request: Request,
  { params }: { params: { tipoAtendimentoId: string } },
) {
  return inativarTipoAtendimentoRoute(request, { tipoAtendimentoId: params.tipoAtendimentoId });
}
