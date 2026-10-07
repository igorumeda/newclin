import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { booleanoQuery, corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { CriarEnderecoParams } from '../../../domain/value-objects/endereco.vo';
import type { AlternarStatusUnidadeUseCase } from '../../../application/use-cases/alternar-status-unidade/alternar-status-unidade.use-case';
import type { AtualizarUnidadeUseCase } from '../../../application/use-cases/atualizar-unidade/atualizar-unidade.use-case';
import type { CriarUnidadeUseCase } from '../../../application/use-cases/criar-unidade/criar-unidade.use-case';
import type { ListarUnidadesUseCase } from '../../../application/use-cases/listar-unidades/listar-unidades.use-case';

export type UnidadeControllerDependencies = {
  listarUnidades: ListarUnidadesUseCase;
  criarUnidade: CriarUnidadeUseCase;
  atualizarUnidade: AtualizarUnidadeUseCase;
  alternarStatusUnidade: AlternarStatusUnidadeUseCase;
};

export class UnidadeController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarUnidades: ListarUnidadesUseCase;
  private readonly criarUnidade: CriarUnidadeUseCase;
  private readonly atualizarUnidade: AtualizarUnidadeUseCase;
  private readonly alternarStatusUnidade: AlternarStatusUnidadeUseCase;

  constructor(dependencies: UnidadeControllerDependencies) {
    super();
    this.listarUnidades = dependencies.listarUnidades;
    this.criarUnidade = dependencies.criarUnidade;
    this.atualizarUnidade = dependencies.atualizarUnidade;
    this.alternarStatusUnidade = dependencies.alternarStatusUnidade;
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
    const resultado = await this.listarUnidades.execute({
      redeId: request.usuario!.redeId,
      busca: textoQuery({ query: request.query, chave: 'busca' }) ?? undefined,
      apenasAtivas: booleanoQuery({ query: request.query, chave: 'apenasAtivas' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarUnidade.execute({
      redeId: request.usuario!.redeId,
      nome: String(dados.nome ?? ''),
      codigo: dados.codigo as string | null | undefined,
      telefone: dados.telefone as string | null | undefined,
      email: dados.email as string | null | undefined,
      endereco: dados.endereco as CriarEnderecoParams | undefined,
      fusoHorario: dados.fusoHorario as string | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    if (dados.ativo !== undefined) {
      const status = await this.alternarStatusUnidade.execute({
        redeId: request.usuario!.redeId,
        id: request.params.id,
        ativo: Boolean(dados.ativo),
      });
      if (status.isFailure) return mapDomainErrorToHttp({ error: status.error });
      return HttpResponse.ok({ data: status.value });
    }

    const resultado = await this.atualizarUnidade.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      nome: dados.nome as string | undefined,
      codigo: dados.codigo as string | null | undefined,
      telefone: dados.telefone as string | null | undefined,
      email: dados.email as string | null | undefined,
      endereco: dados.endereco as CriarEnderecoParams | undefined,
      fusoHorario: dados.fusoHorario as string | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async desativar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.alternarStatusUnidade.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      ativo: false,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
