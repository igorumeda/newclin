import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { ProfissionalController } from '@/modules/profissional/server/api/controllers/profissional.controller';

const handler = createRouteHandler({
  controller: (container) => new ProfissionalController({
      listarProfissionais: container.listarProfissionais,
      criarProfissional: container.criarProfissional,
      atualizarProfissional: container.atualizarProfissional,
      alternarStatusProfissional: container.alternarStatusProfissional,
      definirHorarios: container.definirHorarios,
    }),
  auditoria: { entidade: 'profissional' },
});

export const PATCH = handler;
export const DELETE = handler;
