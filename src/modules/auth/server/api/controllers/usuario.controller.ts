import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { booleanoQuery, corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { AlterarSenhaUseCase } from '../../../application/use-cases/alterar-senha/alterar-senha.use-case';
import type { AlternarStatusUsuarioUseCase } from '../../../application/use-cases/alternar-status-usuario/alternar-status-usuario.use-case';
import type { AtualizarUsuarioUseCase } from '../../../application/use-cases/atualizar-usuario/atualizar-usuario.use-case';
import type { CriarUsuarioUseCase } from '../../../application/use-cases/criar-usuario/criar-usuario.use-case';
import type { ListarUsuariosUseCase } from '../../../application/use-cases/listar-usuarios/listar-usuarios.use-case';

export type UsuarioControllerDependencies = {
  listarUsuarios: ListarUsuariosUseCase;
  criarUsuario: CriarUsuarioUseCase;
  atualizarUsuario: AtualizarUsuarioUseCase;
  alternarStatusUsuario: AlternarStatusUsuarioUseCase;
  alterarSenha: AlterarSenhaUseCase;
};

export class UsuarioController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarUsuarios: ListarUsuariosUseCase;
  private readonly criarUsuario: CriarUsuarioUseCase;
  private readonly atualizarUsuario: AtualizarUsuarioUseCase;
  private readonly alternarStatusUsuario: AlternarStatusUsuarioUseCase;
  private readonly alterarSenha: AlterarSenhaUseCase;

  constructor(dependencies: UsuarioControllerDependencies) {
    super();
    this.listarUsuarios = dependencies.listarUsuarios;
    this.criarUsuario = dependencies.criarUsuario;
    this.atualizarUsuario = dependencies.atualizarUsuario;
    this.alternarStatusUsuario = dependencies.alternarStatusUsuario;
    this.alterarSenha = dependencies.alterarSenha;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;

    if (request.method === 'GET' && !id) return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'PATCH' && id) return this.atualizar(request);
    if (request.method === 'DELETE' && id) return this.desativar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarUsuarios.execute({
      redeId: request.usuario!.redeId,
      busca: textoQuery({ query: request.query, chave: 'busca' }) ?? undefined,
      incluirInativos: booleanoQuery({ query: request.query, chave: 'incluirInativos' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarUsuario.execute({
      redeId: request.usuario!.redeId,
      nome: String(dados.nome ?? ''),
      email: String(dados.email ?? ''),
      senha: String(dados.senha ?? ''),
      role: String(dados.role ?? ''),
      unidadesAcesso: Array.isArray(dados.unidadesAcesso)
        ? (dados.unidadesAcesso as string[])
        : [],
      profissionalId: (dados.profissionalId as string | undefined) ?? null,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    if (dados.senha !== undefined) {
      const troca = await this.alterarSenha.execute({
        redeId: request.usuario!.redeId,
        usuarioId: request.params.id,
        senhaAtual: dados.senhaAtual ? String(dados.senhaAtual) : undefined,
        novaSenha: String(dados.senha),
        exigirSenhaAtual: request.usuario!.id === request.params.id,
      });
      if (troca.isFailure) return mapDomainErrorToHttp({ error: troca.error });
      return HttpResponse.ok({ data: troca.value });
    }

    const resultado = await this.atualizarUsuario.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      nome: dados.nome as string | undefined,
      role: dados.role as string | undefined,
      unidadesAcesso: dados.unidadesAcesso as string[] | undefined,
      profissionalId: dados.profissionalId as string | null | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async desativar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.alternarStatusUsuario.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      ativo: false,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
