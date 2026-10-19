import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AtualizarTipoAtendimentoInputDto,
  AtualizarTipoAtendimentoOutputDto,
  CriarTipoAtendimentoInputDto,
  CriarTipoAtendimentoOutputDto,
  InativarTipoAtendimentoInputDto,
  InativarTipoAtendimentoOutputDto,
  ListarTiposAtendimentoInputDto,
  ListarTiposAtendimentoOutputDto,
} from '../../../application/dtos/agenda.dto';

export type TipoAtendimentoControllerDependencies = {
  listarTiposAtendimento: IUseCase<ListarTiposAtendimentoInputDto, ListarTiposAtendimentoOutputDto>;
  criarTipoAtendimento: IUseCase<CriarTipoAtendimentoInputDto, CriarTipoAtendimentoOutputDto>;
  atualizarTipoAtendimento: IUseCase<
    AtualizarTipoAtendimentoInputDto,
    AtualizarTipoAtendimentoOutputDto
  >;
  inativarTipoAtendimento: IUseCase<
    InativarTipoAtendimentoInputDto,
    InativarTipoAtendimentoOutputDto
  >;
};

export type TipoAtendimentoControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarTiposAtendimentoInputDto, 'redeId'> }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarTipoAtendimentoInputDto, 'redeId'> }
  | {
      action: 'atualizar';
      context: RequestContext;
      tipoAtendimentoId: string;
      input: Omit<AtualizarTipoAtendimentoInputDto, 'tipoAtendimentoId'>;
    }
  | { action: 'inativar'; context: RequestContext; tipoAtendimentoId: string; reativar: boolean };

export class TipoAtendimentoController extends Controller<
  TipoAtendimentoControllerRequest,
  HttpResponse
> {
  private readonly dependencies: TipoAtendimentoControllerDependencies;

  constructor(dependencies: TipoAtendimentoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: TipoAtendimentoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarTiposAtendimento.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.items, { total: result.value.items.length });
      }

      case 'criar': {
        const result = await this.dependencies.criarTipoAtendimento.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'atualizar': {
        const result = await this.dependencies.atualizarTipoAtendimento.execute({
          ...request.input,
          tipoAtendimentoId: request.tipoAtendimentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'inativar': {
        const result = await this.dependencies.inativarTipoAtendimento.execute({
          tipoAtendimentoId: request.tipoAtendimentoId,
          reativar: request.reativar,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
