import {
  validarRecuperacaoRoute,
  obterRecuperacaoRoute,
  redefinirSenhaRoute,
} from '@/modules/user/server/api/routes/recuperacao-senha.routes';
export const dynamic = 'force-dynamic';
export const POST = validarRecuperacaoRoute;
export const GET = obterRecuperacaoRoute;
export const PUT = redefinirSenhaRoute;
