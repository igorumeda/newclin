import { dashboardRoute, relatorioAtendimentosRoute, relatorioFaltasRoute, relatorioNovosPacientesRoute, relatorioDistribuicaoRoute, relatorioProdutividadeRoute, relatorioVisaoGeralRoute } from '@/modules/report/server/api/routes/relatorio.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return relatorioProdutividadeRoute(request);
}
