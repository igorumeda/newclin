import { listarAtendimentosRoute, iniciarAtendimentoRoute, obterAtendimentoRoute, listarEvolucoesRoute, salvarRascunhoAtendimentoRoute, finalizarAtendimentoRoute, cancelarAtendimentoRoute, adicionarAdendoRoute } from '@/modules/medical-record/server/api/routes/atendimento.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { atendimentoId: string } },
) {
  return listarEvolucoesRoute(request, { atendimentoId: params.atendimentoId });
}
