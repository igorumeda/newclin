import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { CriarBloqueioUseCase } from '../../../application/use-cases/criar-bloqueio/criar-bloqueio.use-case';
import type { ListarBloqueiosUseCase } from '../../../application/use-cases/listar-bloqueios/listar-bloqueios.use-case';
import type { RemoverBloqueioUseCase } from '../../../application/use-cases/remover-bloqueio/remover-bloqueio.use-case';

export type BloqueioControllerDependencies = {
  listarBloqueios: ListarBloqueiosUseCase;
  criarBloqueio: CriarBloqueioUseCase;
  removerBloqueio: RemoverBloqueioUseCase;
};

export class BloqueioController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarBloqueios: ListarBloqueiosUseCase;
  private readonly criarBloqueio: CriarBloqueioUseCase;
  private readonly removerBloqueio: RemoverBloqueioUseCase;

  constructor(dependencies: BloqueioControllerDependencies) {
    super();
    this.listarBloqueios = dependencies.listarBloqueios;
    this.criarBloqueio = dependencies.criarBloqueio;
    this.removerBloqueio = dependencies.removerBloqueio;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;

    if (request.method === 'GET' && !id) return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'DELETE' && id) return this.remover(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const inicio = textoQuery({ query: request.query, chave: 'inicio' });
    const fim = textoQuery({ query: request.query, chave: 'fim' });
    if (!inicio || !fim) {
      return HttpResponse.badRequest({ message: 'Informe o período (inicio e fim)' });
    }

    const resultado = await this.listarBloqueios.execute({
      redeId: request.usuario!.redeId,
      unidadeId: textoQuery({ query: request.query, chave: 'unidadeId' }),
      profissionalId: textoQuery({ query: request.query, chave: 'profissionalId' }),
      inicio,
      fim,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarBloqueio.execute({
      redeId: request.usuario!.redeId,
      unidadeId: String(dados.unidadeId ?? ''),
      profissionalId: dados.profissionalId as string | null | undefined,
      motivo: String(dados.motivo ?? ''),
      inicio: String(dados.inicio ?? ''),
      fim: String(dados.fim ?? ''),
      criadoPor: request.usuario!.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async remover(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.removerBloqueio.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.noContent();
  }
}
