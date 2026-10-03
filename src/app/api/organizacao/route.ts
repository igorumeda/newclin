import { obterOrganizacaoRoute, atualizarOrganizacaoRoute, atualizarTemaRoute, definirLogotipoRoute, listarUnidadesRoute, criarUnidadeRoute, atualizarUnidadeRoute, inativarUnidadeRoute, reativarUnidadeRoute } from '@/modules/organization/server/api/routes/organizacao.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return obterOrganizacaoRoute(request);
}

export async function PUT(request: Request) {
  return atualizarOrganizacaoRoute(request);
}
