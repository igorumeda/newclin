import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AtualizarTemplateInputDto,
  AtualizarTemplateOutputDto,
  ClonarTemplateInputDto,
  ClonarTemplateOutputDto,
  CriarTemplateInputDto,
  CriarTemplateOutputDto,
  InativarTemplateInputDto,
  InativarTemplateOutputDto,
  ListarTemplatesInputDto,
  ListarTemplatesOutputDto,
  ObterTemplateInputDto,
  ObterTemplateOutputDto,
} from '../../../application/dtos/prontuario.dto';

export type TemplateControllerDependencies = {
  listarTemplates: IUseCase<ListarTemplatesInputDto, ListarTemplatesOutputDto>;
  obterTemplate: IUseCase<ObterTemplateInputDto, ObterTemplateOutputDto>;
  criarTemplate: IUseCase<CriarTemplateInputDto, CriarTemplateOutputDto>;
  clonarTemplate: IUseCase<ClonarTemplateInputDto, ClonarTemplateOutputDto>;
  atualizarTemplate: IUseCase<AtualizarTemplateInputDto, AtualizarTemplateOutputDto>;
  inativarTemplate: IUseCase<InativarTemplateInputDto, InativarTemplateOutputDto>;
};

export type TemplateControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarTemplatesInputDto, 'redeId'> }
  | { action: 'obter'; context: RequestContext; templateId: string }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarTemplateInputDto, 'redeId' | 'createdBy'> }
  | {
      action: 'clonar';
      context: RequestContext;
      templateId: string;
      input: Omit<ClonarTemplateInputDto, 'templateId' | 'redeId' | 'createdBy'>;
    }
  | {
      action: 'atualizar';
      context: RequestContext;
      templateId: string;
      input: Omit<AtualizarTemplateInputDto, 'templateId'>;
    }
  | { action: 'inativar'; context: RequestContext; templateId: string; reativar: boolean };

export class TemplateController extends Controller<TemplateControllerRequest, HttpResponse> {
  private readonly dependencies: TemplateControllerDependencies;

  constructor(dependencies: TemplateControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: TemplateControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarTemplates.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        return HttpResponse.ok(result.value.items, {
          total: result.value.items.length,
          especialidades: result.value.especialidades,
        });
      }

      case 'obter': {
        const result = await this.dependencies.obterTemplate.execute({ templateId: request.templateId });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'criar': {
        const result = await this.dependencies.criarTemplate.execute({
          ...request.input,
          redeId: request.context.redeId,
          createdBy: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'clonar': {
        const result = await this.dependencies.clonarTemplate.execute({
          ...request.input,
          templateId: request.templateId,
          redeId: request.context.redeId,
          createdBy: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'atualizar': {
        const result = await this.dependencies.atualizarTemplate.execute({
          ...request.input,
          templateId: request.templateId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'inativar': {
        const result = await this.dependencies.inativarTemplate.execute({
          templateId: request.templateId,
          reativar: request.reativar,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
