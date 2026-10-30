import { obterResumoMasterRoute } from '@/modules/organization/server/api/routes/organizacao.routes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return obterResumoMasterRoute(request);
}

