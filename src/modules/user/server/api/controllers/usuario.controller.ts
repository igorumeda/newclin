import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type { ListarUsuariosInputDto } from '../../../application/use-cases/listar-usuarios/listar-usuarios.input.dto';
import type { ListarUsuariosOutputDto } from '../../../application/use-cases/listar-usuarios/listar-usuarios.output.dto';
import type { CriarUsuarioInputDto } from '../../../application/use-cases/criar-usuario/criar-usuario.input.dto';
import type { CriarUsuarioOutputDto } from '../../../application/use-cases/criar-usuario/criar-usuario.output.dto';
import type { AtualizarUsuarioInputDto } from '../../../application/use-cases/atualizar-usuario/atualizar-usuario.input.dto';
import type { AtualizarUsuarioOutputDto } from '../../../application/use-cases/atualizar-usuario/atualizar-usuario.output.dto';
import type { InativarUsuarioInputDto } from '../../../application/use-cases/inativar-usuario/inativar-usuario.input.dto';
import type { InativarUsuarioOutputDto } from '../../../application/use-cases/inativar-usuario/inativar-usuario.output.dto';
import type { ReativarUsuarioInputDto } from '../../../application/use-cases/reativar-usuario/reativar-usuario.input.dto';
import type { ReativarUsuarioOutputDto } from '../../../application/use-cases/reativar-usuario/reativar-usuario.output.dto';
import type { ObterPerfilAtualInputDto } from '../../../application/use-cases/obter-perfil-atual/obter-perfil-atual.input.dto';
import type { ObterPerfilAtualOutputDto } from '../../../application/use-cases/obter-perfil-atual/obter-perfil-atual.output.dto';

export type UsuarioControllerDependencies = {
  listarUsuarios: IUseCase<ListarUsuariosInputDto, ListarUsuariosOutputDto>;
  criarUsuario: IUseCase<CriarUsuarioInputDto, CriarUsuarioOutputDto>;
  atualizarUsuario: IUseCase<AtualizarUsuarioInputDto, AtualizarUsuarioOutputDto>;
  inativarUsuario: IUseCase<InativarUsuarioInputDto, InativarUsuarioOutputDto>;
  reativarUsuario: IUseCase<ReativarUsuarioInputDto, ReativarUsuarioOutputDto>;
  obterPerfilAtual: IUseCase<ObterPerfilAtualInputDto, ObterPerfilAtualOutputDto>;
};

export type UsuarioControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarUsuariosInputDto, 'redeId'> }
  | { action: 'perfil-atual'; context: RequestContext }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarUsuarioInputDto, 'redeId' | 'appUrl'>; appUrl: string }
  | { action: 'atualizar'; context: RequestContext; usuarioId: string; input: Omit<AtualizarUsuarioInputDto, 'usuarioId'> }
  | { action: 'inativar'; context: RequestContext; usuarioId: string }
  | { action: 'reativar'; context: RequestContext; usuarioId: string };

/** Controller fino: traduz HTTP → Use Case → HttpResponse, sem regra de negócio. */
export class UsuarioController extends Controller<UsuarioControllerRequest, HttpResponse> {
  private readonly dependencies: UsuarioControllerDependencies;

  constructor(dependencies: UsuarioControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: UsuarioControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar':
        return this.listar(request);
      case 'perfil-atual':
        return this.perfilAtual(request);
      case 'criar':
        return this.criar(request);
      case 'atualizar':
        return this.atualizar(request);
      case 'inativar':
        return this.inativar(request);
      case 'reativar':
        return this.reativar(request);
    }
  }

  private async listar(
    request: Extract<UsuarioControllerRequest, { action: 'listar' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.listarUsuarios.execute({
      ...request.input,
      redeId: request.context.redeId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value.items, { ...result.value.meta });
  }

  private async perfilAtual(
    request: Extract<UsuarioControllerRequest, { action: 'perfil-atual' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.obterPerfilAtual.execute({
      usuarioId: request.context.userId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async criar(
    request: Extract<UsuarioControllerRequest, { action: 'criar' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.criarUsuario.execute({
      ...request.input,
      redeId: request.context.redeId,
      appUrl: request.appUrl,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.created(result.value);
  }

  private async atualizar(
    request: Extract<UsuarioControllerRequest, { action: 'atualizar' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.atualizarUsuario.execute({
      usuarioId: request.usuarioId,
      ...request.input,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async inativar(
    request: Extract<UsuarioControllerRequest, { action: 'inativar' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.inativarUsuario.execute({
      usuarioId: request.usuarioId,
      solicitanteId: request.context.userId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }

  private async reativar(
    request: Extract<UsuarioControllerRequest, { action: 'reativar' }>,
  ): Promise<HttpResponse> {
    const result = await this.dependencies.reativarUsuario.execute({
      usuarioId: request.usuarioId,
    });
    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value);
  }
}
