import { NotFoundError } from '@core/domain/errors/not-found.error';

export type TemplateNaoEncontradoErrorParams = { templateId: string };

export class TemplateNaoEncontradoError extends NotFoundError {
  constructor(params: TemplateNaoEncontradoErrorParams) {
    super({
      message: `Template "${params.templateId}" não encontrado`,
      code: 'TEMPLATE_NAO_ENCONTRADO',
    });
    this.name = 'TemplateNaoEncontradoError';
  }
}
