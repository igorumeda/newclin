import {
  aceitarConviteRoute,
  obterConviteRoute,
  concluirConviteRoute,
} from '@/modules/user/server/api/routes/convite.routes';

export const dynamic = 'force-dynamic';
export const GET = obterConviteRoute;
export const POST = aceitarConviteRoute;
export const PUT = concluirConviteRoute;
