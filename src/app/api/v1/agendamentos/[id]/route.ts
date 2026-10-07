import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { AgendamentoController } from '@/modules/agenda/server/api/controllers/agendamento.controller';

const handler = createRouteHandler({
  controller: (container) => new AgendamentoController({
      listarAgendamentos: container.listarAgendamentos,
      criarAgendamento: container.criarAgendamento,
      alterarStatusAgendamento: container.alterarStatusAgendamento,
      registrarCheckin: container.registrarCheckin,
    }),
  auditoria: { entidade: 'agendamento' },
});

export const PATCH = handler;
