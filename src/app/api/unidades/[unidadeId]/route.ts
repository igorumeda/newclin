import { obterOrganizacaoRoute, atualizarOrganizacaoRoute, atualizarTemaRoute, definirLogotipoRoute, listarUnidadesRoute, criarUnidadeRoute, atualizarUnidadeRoute, inativarUnidadeRoute, reativarUnidadeRoute } from '@/modules/organization/server/api/routes/organizacao.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { unidadeId: string } },
) {
  return atualizarUnidadeRoute(request, { unidadeId: params.unidadeId });
}

export async function DELETE(
  request: Request,
  { params }: { params: { unidadeId: string } },
) {
  return inativarUnidadeRoute(request, { unidadeId: params.unidadeId });
}
