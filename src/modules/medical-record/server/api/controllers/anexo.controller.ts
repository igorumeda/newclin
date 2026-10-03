import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  EnviarAnexoInputDto,
  EnviarAnexoOutputDto,
  ListarAnexosInputDto,
  ListarAnexosOutputDto,
  ObterLinkAnexoInputDto,
  ObterLinkAnexoOutputDto,
  RemoverAnexoInputDto,
  RemoverAnexoOutputDto,
} from '../../../application/dtos/prontuario.dto';

export type AnexoControllerDependencies = {
  enviarAnexo: IUseCase<EnviarAnexoInputDto, EnviarAnexoOutputDto>;
  listarAnexos: IUseCase<ListarAnexosInputDto, ListarAnexosOutputDto>;
  obterLinkAnexo: IUseCase<ObterLinkAnexoInputDto, ObterLinkAnexoOutputDto>;
  removerAnexo: IUseCase<RemoverAnexoInputDto, RemoverAnexoOutputDto>;
};

export type AnexoControllerRequest =
  | {
      action: 'enviar';
      context: RequestContext;
      input: Omit<EnviarAnexoInputDto, 'redeId' | 'uploadedBy'>;
    }
  | { action: 'listar'; context: RequestContext; input: Omit<ListarAnexosInputDto, 'redeId'> }
  | { action: 'link'; anexoId: string; input: Omit<ObterLinkAnexoInputDto, 'anexoId'> }
  | { action: 'remover'; anexoId: string };

export class AnexoController extends Controller<AnexoControllerRequest, HttpResponse> {
  private readonly dependencies: AnexoControllerDependencies;

  constructor(dependencies: AnexoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: AnexoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'enviar': {
        const result = await this.dependencies.enviarAnexo.execute({
          ...request.input,
          redeId: request.context.redeId,
          uploadedBy: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'listar': {
        const result = await this.dependencies.listarAnexos.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.items, { total: result.value.items.length });
      }

      case 'link': {
        const result = await this.dependencies.obterLinkAnexo.execute({
          ...request.input,
          anexoId: request.anexoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'remover': {
        const result = await this.dependencies.removerAnexo.execute({ anexoId: request.anexoId });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
