import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  PainelRecepcaoInputDto,
  PainelRecepcaoOutputDto,
  RegistrarChegadaInputDto,
  RegistrarChegadaOutputDto,
} from '../../../application/dtos/agenda.dto';

export type RecepcaoControllerDependencies = {
  painelRecepcao: IUseCase<PainelRecepcaoInputDto, PainelRecepcaoOutputDto>;
  registrarChegada: IUseCase<RegistrarChegadaInputDto, RegistrarChegadaOutputDto>;
};

export type RecepcaoControllerRequest =
  | { action: 'painel'; context: RequestContext; input: Omit<PainelRecepcaoInputDto, 'redeId'> }
  | {
      action: 'check-in';
      context: RequestContext;
      agendamentoId: string;
      unidadeId?: string | null;
    };

/** Painel de trabalho da recepção (§3.4): lista do dia + check-in. */
export class RecepcaoController extends Controller<RecepcaoControllerRequest, HttpResponse> {
  private readonly dependencies: RecepcaoControllerDependencies;

  constructor(dependencies: RecepcaoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: RecepcaoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'painel': {
        const result = await this.dependencies.painelRecepcao.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value, {
          data: result.value.data,
          indicadores: result.value.indicadores,
        });
      }

      case 'check-in': {
        const result = await this.dependencies.registrarChegada.execute({
          agendamentoId: request.agendamentoId,
          unidadeId: request.unidadeId ?? null,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
