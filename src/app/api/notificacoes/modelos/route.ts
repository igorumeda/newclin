import { listarNotificacoesRoute, listarModelosMensagemRoute, salvarModeloMensagemRoute, reenviarNotificacaoRoute, processarFilaNotificacoesRoute, enfileirarLembretesRoute } from '@/modules/notification/server/api/routes/notificacao.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return listarModelosMensagemRoute(request);
}

export async function PUT(request: Request) {
  return salvarModeloMensagemRoute(request);
}
