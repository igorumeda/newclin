import {
  criarRedeMasterRoute,
  obterResumoMasterRoute,
} from '@/modules/organization/server/api/routes/organizacao.routes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return obterResumoMasterRoute(request);
}

export async function POST(request: Request) {
  return criarRedeMasterRoute(request);
}
