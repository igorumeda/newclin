import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  DashboardDto,
  RelatorioAtendimentosOutputDto,
  RelatorioDistribuicaoOutputDto,
  RelatorioFaltasOutputDto,
  RelatorioFiltroInputDto,
  RelatorioNovosPacientesOutputDto,
  RelatorioProdutividadeOutputDto,
  RelatorioVisaoGeralOutputDto,
} from '../../../application/dtos/relatorio.dto';

export type RelatorioControllerDependencies = {
  obterDashboard: IUseCase<{ unidadeId?: string | null }, DashboardDto>;
  relatorioAtendimentos: IUseCase<RelatorioFiltroInputDto, RelatorioAtendimentosOutputDto>;
  relatorioFaltas: IUseCase<RelatorioFiltroInputDto, RelatorioFaltasOutputDto>;
  relatorioNovosPacientes: IUseCase<RelatorioFiltroInputDto, RelatorioNovosPacientesOutputDto>;
  relatorioDistribuicao: IUseCase<
    RelatorioFiltroInputDto & { dimensao?: 'tipo' | 'especialidade' | null },
    RelatorioDistribuicaoOutputDto
  >;
  relatorioProdutividade: IUseCase<RelatorioFiltroInputDto, RelatorioProdutividadeOutputDto>;
  relatorioVisaoGeral: IUseCase<RelatorioFiltroInputDto, RelatorioVisaoGeralOutputDto>;
};

export type RelatorioControllerRequest =
  | { action: 'dashboard'; context: RequestContext; unidadeId?: string | null }
  | { action: 'atendimentos'; context: RequestContext; input: Omit<RelatorioFiltroInputDto, 'redeId'> }
  | { action: 'faltas'; context: RequestContext; input: Omit<RelatorioFiltroInputDto, 'redeId'> }
  | {
      action: 'novos-pacientes';
      context: RequestContext;
      input: Omit<RelatorioFiltroInputDto, 'redeId'>;
    }
  | {
      action: 'distribuicao';
      context: RequestContext;
      input: Omit<RelatorioFiltroInputDto, 'redeId'> & { dimensao?: 'tipo' | 'especialidade' | null };
    }
  | {
      action: 'produtividade';
      context: RequestContext;
      input: Omit<RelatorioFiltroInputDto, 'redeId'>;
    }
  | { action: 'visao-geral'; context: RequestContext; input: Omit<RelatorioFiltroInputDto, 'redeId'> };

export class RelatorioController extends Controller<RelatorioControllerRequest, HttpResponse> {
  private readonly dependencies: RelatorioControllerDependencies;

  constructor(dependencies: RelatorioControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: RelatorioControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'dashboard': {
        const result = await this.dependencies.obterDashboard.execute({
          unidadeId: request.unidadeId ?? null,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'atendimentos': {
        const result = await this.dependencies.relatorioAtendimentos.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'faltas': {
        const result = await this.dependencies.relatorioFaltas.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'novos-pacientes': {
        const result = await this.dependencies.relatorioNovosPacientes.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'distribuicao': {
        const result = await this.dependencies.relatorioDistribuicao.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'produtividade': {
        const result = await this.dependencies.relatorioProdutividade.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'visao-geral': {
        const result = await this.dependencies.relatorioVisaoGeral.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
