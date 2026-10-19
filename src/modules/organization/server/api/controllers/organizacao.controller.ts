import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AtualizarOrganizacaoInputDto,
  AtualizarOrganizacaoOutputDto,
  AtualizarTemaInputDto,
  AtualizarTemaOutputDto,
  AtualizarUnidadeInputDto,
  AtualizarUnidadeOutputDto,
  CriarUnidadeInputDto,
  CriarUnidadeOutputDto,
  DefinirLogotipoInputDto,
  DefinirLogotipoOutputDto,
  InativarUnidadeInputDto,
  InativarUnidadeOutputDto,
  ListarUnidadesInputDto,
  ListarUnidadesOutputDto,
  ObterOrganizacaoInputDto,
  ObterOrganizacaoOutputDto,
} from '../../../application/dtos/organizacao.dto';

export type OrganizacaoControllerDependencies = {
  obterOrganizacao: IUseCase<ObterOrganizacaoInputDto, ObterOrganizacaoOutputDto>;
  atualizarOrganizacao: IUseCase<AtualizarOrganizacaoInputDto, AtualizarOrganizacaoOutputDto>;
  atualizarTema: IUseCase<AtualizarTemaInputDto, AtualizarTemaOutputDto>;
  definirLogotipo: IUseCase<DefinirLogotipoInputDto, DefinirLogotipoOutputDto>;
  listarUnidades: IUseCase<ListarUnidadesInputDto, ListarUnidadesOutputDto>;
  criarUnidade: IUseCase<CriarUnidadeInputDto, CriarUnidadeOutputDto>;
  atualizarUnidade: IUseCase<AtualizarUnidadeInputDto, AtualizarUnidadeOutputDto>;
  inativarUnidade: IUseCase<InativarUnidadeInputDto, InativarUnidadeOutputDto>;
};

export type OrganizacaoControllerRequest =
  | { action: 'obter'; context: RequestContext }
  | { action: 'atualizar'; context: RequestContext; input: Omit<AtualizarOrganizacaoInputDto, 'redeId'> }
  | { action: 'atualizar-tema'; context: RequestContext; input: Omit<AtualizarTemaInputDto, 'redeId'> }
  | { action: 'definir-logotipo'; context: RequestContext; input: Omit<DefinirLogotipoInputDto, 'redeId'> }
  | {
      action: 'listar-unidades';
      context: RequestContext;
      input: Omit<ListarUnidadesInputDto, 'redeId' | 'unidadeIdsRestritas'>;
    }
  | { action: 'criar-unidade'; context: RequestContext; input: Omit<CriarUnidadeInputDto, 'redeId'> }
  | {
      action: 'atualizar-unidade';
      context: RequestContext;
      unidadeId: string;
      input: Omit<AtualizarUnidadeInputDto, 'unidadeId'>;
    }
  | { action: 'inativar-unidade'; context: RequestContext; unidadeId: string; reativar: boolean };

export class OrganizacaoController extends Controller<OrganizacaoControllerRequest, HttpResponse> {
  private readonly dependencies: OrganizacaoControllerDependencies;

  constructor(dependencies: OrganizacaoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: OrganizacaoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'obter':
        return this.obter(request.context);
      case 'atualizar':
        return this.atualizar(request);
      case 'atualizar-tema':
        return this.atualizarTema(request);
      case 'definir-logotipo':
        return this.definirLogotipo(request);
      case 'listar-unidades':
        return this.listarUnidades(request);
      case 'criar-unidade':
        return this.criarUnidade(request);
      case 'atualizar-unidade':
        return this.atualizarUnidade(request);
      case 'inativar-unidade':
        return this.inativarUnidade(request);
    }
  }

  private async obter(context: RequestContext): Promise<HttpResponse> {
    const result = await this.dependencies.obterOrganizacao.execute({ redeId: context.redeId });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async atualizar(
    request: Extract<OrganizacaoControllerRequest, { action: 'atualizar' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.atualizarOrganizacao.execute({
      ...request.input,
      redeId: request.context.redeId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async atualizarTema(
    request: Extract<OrganizacaoControllerRequest, { action: 'atualizar-tema' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.atualizarTema.execute({
      ...request.input,
      redeId: request.context.redeId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async definirLogotipo(
    request: Extract<OrganizacaoControllerRequest, { action: 'definir-logotipo' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.definirLogotipo.execute({
      ...request.input,
      redeId: request.context.redeId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async listarUnidades(
    request: Extract<OrganizacaoControllerRequest, { action: 'listar-unidades' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.listarUnidades.execute({
      ...request.input,
      redeId: request.context.redeId,
      unidadeIdsRestritas:
        request.context.role === 'admin_rede' ? undefined : request.context.unidadesAcesso,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value.items, { total: result.value.items.length });
  }

  private async criarUnidade(
    request: Extract<OrganizacaoControllerRequest, { action: 'criar-unidade' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.criarUnidade.execute({
      ...request.input,
      redeId: request.context.redeId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.created(result.value);
  }

  private async atualizarUnidade(
    request: Extract<OrganizacaoControllerRequest, { action: 'atualizar-unidade' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.atualizarUnidade.execute({
      ...request.input,
      unidadeId: request.unidadeId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async inativarUnidade(
    request: Extract<OrganizacaoControllerRequest, { action: 'inativar-unidade' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.inativarUnidade.execute({
      unidadeId: request.unidadeId,
      reativar: request.reativar,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }
}
