import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { TemplateController } from '@/modules/prontuario/server/api/controllers/template.controller';

const handler = createRouteHandler({
  controller: (container) => new TemplateController({
      listarTemplates: container.listarTemplates,
      obterTemplate: container.obterTemplate,
      criarTemplate: container.criarTemplate,
      atualizarTemplate: container.atualizarTemplate,
    }),
  auditoria: { entidade: 'template_prontuario' },
});

export const GET = handler;
export const PATCH = handler;
