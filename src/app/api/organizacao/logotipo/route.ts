import { obterOrganizacaoRoute, atualizarOrganizacaoRoute, atualizarTemaRoute, definirLogotipoRoute, listarUnidadesRoute, criarUnidadeRoute, atualizarUnidadeRoute, inativarUnidadeRoute, reativarUnidadeRoute } from '@/modules/organization/server/api/routes/organizacao.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return definirLogotipoRoute(request);
}
