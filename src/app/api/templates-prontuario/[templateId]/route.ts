import { listarTemplatesRoute, obterTemplateRoute, criarTemplateRoute, clonarTemplateRoute, atualizarTemplateRoute, inativarTemplateRoute } from '@/modules/medical-record/server/api/routes/template.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { templateId: string } },
) {
  return obterTemplateRoute(request, { templateId: params.templateId });
}

export async function PUT(
  request: Request,
  { params }: { params: { templateId: string } },
) {
  return atualizarTemplateRoute(request, { templateId: params.templateId });
}

export async function DELETE(
  request: Request,
  { params }: { params: { templateId: string } },
) {
  return inativarTemplateRoute(request, { templateId: params.templateId });
}
