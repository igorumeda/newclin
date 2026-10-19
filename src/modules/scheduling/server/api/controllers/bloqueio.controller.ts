import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  CriarBloqueioInputDto,
  CriarBloqueioOutputDto,
  ListarBloqueiosInputDto,
  ListarBloqueiosOutputDto,
  RemoverBloqueioInputDto,
  RemoverBloqueioOutputDto,
} from '../../../application/dtos/agenda.dto';

export type BloqueioControllerDependencies = {
  listarBloqueios: IUseCase<ListarBloqueiosInputDto, ListarBloqueiosOutputDto>;
  criarBloqueio: IUseCase<CriarBloqueioInputDto, CriarBloqueioOutputDto>;
  removerBloqueio: IUseCase<RemoverBloqueioInputDto, RemoverBloqueioOutputDto>;
};

export type BloqueioControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarBloqueiosInputDto, 'redeId'> }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarBloqueioInputDto, 'redeId' | 'criadoPor'> }
  | { action: 'remover'; context: RequestContext; bloqueioId: string };

export class BloqueioController extends Controller<BloqueioControllerRequest, HttpResponse> {
  private readonly dependencies: BloqueioControllerDependencies;

  constructor(dependencies: BloqueioControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: BloqueioControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarBloqueios.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.items, { total: result.value.items.length });
      }

      case 'criar': {
        const result = await this.dependencies.criarBloqueio.execute({
          ...request.input,
          redeId: request.context.redeId,
          criadoPor: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'remover': {
        const result = await this.dependencies.removerBloqueio.execute({
          bloqueioId: request.bloqueioId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
