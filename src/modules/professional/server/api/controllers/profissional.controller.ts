import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AtualizarProfissionalInputDto,
  AtualizarProfissionalOutputDto,
  CriarProfissionalInputDto,
  CriarProfissionalOutputDto,
  DefinirHorariosInputDto,
  DefinirHorariosOutputDto,
  DefinirUnidadesProfissionalInputDto,
  DefinirUnidadesProfissionalOutputDto,
  InativarProfissionalInputDto,
  InativarProfissionalOutputDto,
  ListarProfissionaisInputDto,
  ListarProfissionaisOutputDto,
} from '../../../application/dtos/profissional.dto';

export type ProfissionalControllerDependencies = {
  listarProfissionais: IUseCase<ListarProfissionaisInputDto, ListarProfissionaisOutputDto>;
  criarProfissional: IUseCase<CriarProfissionalInputDto, CriarProfissionalOutputDto>;
  atualizarProfissional: IUseCase<AtualizarProfissionalInputDto, AtualizarProfissionalOutputDto>;
  inativarProfissional: IUseCase<InativarProfissionalInputDto, InativarProfissionalOutputDto>;
  definirHorarios: IUseCase<DefinirHorariosInputDto, DefinirHorariosOutputDto>;
  definirUnidades: IUseCase<DefinirUnidadesProfissionalInputDto, DefinirUnidadesProfissionalOutputDto>;
};

export type ProfissionalControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarProfissionaisInputDto, 'redeId'> }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarProfissionalInputDto, 'redeId'> }
  | {
      action: 'atualizar';
      context: RequestContext;
      profissionalId: string;
      input: Omit<AtualizarProfissionalInputDto, 'profissionalId'>;
    }
  | { action: 'inativar'; context: RequestContext; profissionalId: string; reativar: boolean }
  | {
      action: 'definir-horarios';
      context: RequestContext;
      profissionalId: string;
      input: Omit<DefinirHorariosInputDto, 'redeId' | 'profissionalId'>;
    }
  | {
      action: 'definir-unidades';
      context: RequestContext;
      profissionalId: string;
      input: Omit<DefinirUnidadesProfissionalInputDto, 'redeId' | 'profissionalId'>;
    };

export class ProfissionalController extends Controller<ProfissionalControllerRequest, HttpResponse> {
  private readonly dependencies: ProfissionalControllerDependencies;

  constructor(dependencies: ProfissionalControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: ProfissionalControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarProfissionais.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.items, { total: result.value.items.length });
      }

      case 'criar': {
        const result = await this.dependencies.criarProfissional.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'atualizar': {
        const result = await this.dependencies.atualizarProfissional.execute({
          profissionalId: request.profissionalId,
          ...request.input,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'inativar': {
        const result = await this.dependencies.inativarProfissional.execute({
          profissionalId: request.profissionalId,
          reativar: request.reativar,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'definir-horarios': {
        const result = await this.dependencies.definirHorarios.execute({
          ...request.input,
          redeId: request.context.redeId,
          profissionalId: request.profissionalId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'definir-unidades': {
        const result = await this.dependencies.definirUnidades.execute({
          ...request.input,
          redeId: request.context.redeId,
          profissionalId: request.profissionalId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
