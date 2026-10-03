import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { buildPaginationMeta } from '@core/application/pagination/pagination';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AdicionarAdendoInputDto,
  AdicionarAdendoOutputDto,
  AtendimentoDto,
  CancelarAtendimentoInputDto,
  CancelarAtendimentoOutputDto,
  FinalizarAtendimentoInputDto,
  FinalizarAtendimentoOutputDto,
  IniciarAtendimentoInputDto,
  IniciarAtendimentoOutputDto,
  ListarAtendimentosInputDto,
  ListarAtendimentosOutputDto,
  ObterAtendimentoInputDto,
  ObterAtendimentoOutputDto,
  SalvarRascunhoInputDto,
  SalvarRascunhoOutputDto,
} from '../../../application/dtos/prontuario.dto';
import type { EvolucaoDto } from '../../../application/dtos/prontuario.dto';

export type AtendimentoControllerDependencies = {
  iniciarAtendimento: IUseCase<IniciarAtendimentoInputDto, IniciarAtendimentoOutputDto>;
  obterAtendimento: IUseCase<ObterAtendimentoInputDto, ObterAtendimentoOutputDto>;
  salvarRascunho: IUseCase<SalvarRascunhoInputDto, SalvarRascunhoOutputDto>;
  finalizarAtendimento: IUseCase<FinalizarAtendimentoInputDto, FinalizarAtendimentoOutputDto>;
  cancelarAtendimento: IUseCase<CancelarAtendimentoInputDto, CancelarAtendimentoOutputDto>;
  adicionarAdendo: IUseCase<AdicionarAdendoInputDto, AdicionarAdendoOutputDto>;
  listarAtendimentos: IUseCase<ListarAtendimentosInputDto, ListarAtendimentosOutputDto>;
  listarEvolucoes: IUseCase<{ atendimentoId: string }, EvolucaoDto[]>;
};

export type AtendimentoControllerRequest =
  | {
      action: 'iniciar';
      context: RequestContext;
      input: Omit<IniciarAtendimentoInputDto, 'redeId' | 'createdBy'>;
    }
  | { action: 'obter'; context: RequestContext; atendimentoId: string }
  | {
      action: 'salvar-rascunho';
      context: RequestContext;
      atendimentoId: string;
      input: Omit<SalvarRascunhoInputDto, 'atendimentoId'>;
    }
  | { action: 'finalizar'; context: RequestContext; atendimentoId: string }
  | {
      action: 'cancelar';
      context: RequestContext;
      atendimentoId: string;
      input: Omit<CancelarAtendimentoInputDto, 'atendimentoId'>;
    }
  | {
      action: 'adicionar-adendo';
      context: RequestContext;
      atendimentoId: string;
      input: Omit<AdicionarAdendoInputDto, 'atendimentoId' | 'autorId'>;
    }
  | { action: 'listar'; context: RequestContext; input: Omit<ListarAtendimentosInputDto, 'redeId'> }
  | { action: 'listar-evolucoes'; context: RequestContext; atendimentoId: string };

export class AtendimentoController extends Controller<AtendimentoControllerRequest, HttpResponse> {
  private readonly dependencies: AtendimentoControllerDependencies;

  constructor(dependencies: AtendimentoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: AtendimentoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'iniciar': {
        const result = await this.dependencies.iniciarAtendimento.execute({
          ...request.input,
          redeId: request.context.redeId,
          createdBy: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'obter': {
        const result = await this.dependencies.obterAtendimento.execute({
          atendimentoId: request.atendimentoId,
          usuarioId: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        const evolucoes = await this.dependencies.listarEvolucoes.execute({
          atendimentoId: request.atendimentoId,
        });

        return HttpResponse.ok({
          ...result.value,
          evolucoes: evolucoes.isSuccess ? evolucoes.value : [],
        });
      }

      case 'salvar-rascunho': {
        const result = await this.dependencies.salvarRascunho.execute({
          ...request.input,
          atendimentoId: request.atendimentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'finalizar': {
        const result = await this.dependencies.finalizarAtendimento.execute({
          atendimentoId: request.atendimentoId,
          usuarioId: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'cancelar': {
        const result = await this.dependencies.cancelarAtendimento.execute({
          atendimentoId: request.atendimentoId,
          motivo: request.input.motivo,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'adicionar-adendo': {
        const result = await this.dependencies.adicionarAdendo.execute({
          ...request.input,
          atendimentoId: request.atendimentoId,
          autorId: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'listar': {
        const result = await this.dependencies.listarAtendimentos.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        const { items, total } = result.value;
        const perPage = request.input.perPage ?? 20;
        const page = request.input.page ?? 1;

        return HttpResponse.ok(items, buildPaginationMeta({ pagination: { page, perPage }, total }));
      }

      case 'listar-evolucoes': {
        const result = await this.dependencies.listarEvolucoes.execute({
          atendimentoId: request.atendimentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok<readonly EvolucaoDto[]>(result.value);
      }
    }
  }
}

export type { AtendimentoDto };
