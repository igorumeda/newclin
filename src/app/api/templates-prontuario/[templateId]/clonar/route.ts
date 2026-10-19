import { listarTemplatesRoute, obterTemplateRoute, criarTemplateRoute, clonarTemplateRoute, atualizarTemplateRoute, inativarTemplateRoute } from '@/modules/medical-record/server/api/routes/template.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { templateId: string } },
) {
  return clonarTemplateRoute(request, { templateId: params.templateId });
}
