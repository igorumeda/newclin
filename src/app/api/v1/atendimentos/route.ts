import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { AtendimentoController } from '@/modules/prontuario/server/api/controllers/atendimento.controller';

const handler = createRouteHandler({
  controller: (container) => new AtendimentoController({
      listarAtendimentos: container.listarAtendimentos,
      obterAtendimento: container.obterAtendimento,
      iniciarAtendimento: container.iniciarAtendimento,
      salvarAtendimento: container.salvarAtendimento,
      finalizarAtendimento: container.finalizarAtendimento,
      adicionarAdendo: container.adicionarAdendo,
    }),
  auditoria: { entidade: 'atendimento' },
});

export const GET = handler;
export const POST = handler;
