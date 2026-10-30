import { atualizarRedeMasterRoute } from '@/modules/organization/server/api/routes/organizacao.routes';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { redeId: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  return atualizarRedeMasterRoute(request, params);
}

