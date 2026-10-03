import { listarUsuariosRoute, criarUsuarioRoute, atualizarUsuarioRoute, inativarUsuarioRoute, reativarUsuarioRoute } from '@/modules/user/server/api/routes/usuario.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { usuarioId: string } },
) {
  return atualizarUsuarioRoute(request, { usuarioId: params.usuarioId });
}
