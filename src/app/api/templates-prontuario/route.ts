import { listarTemplatesRoute, obterTemplateRoute, criarTemplateRoute, clonarTemplateRoute, atualizarTemplateRoute, inativarTemplateRoute } from '@/modules/medical-record/server/api/routes/template.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return listarTemplatesRoute(request);
}

export async function POST(request: Request) {
  return criarTemplateRoute(request);
}
