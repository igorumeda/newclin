import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { PainelRecepcaoUseCase } from '../../../application/use-cases/painel-recepcao/painel-recepcao.use-case';

export type RecepcaoControllerDependencies = { painelRecepcao: PainelRecepcaoUseCase };

/** GET /api/v1/recepcao — painel do dia por unidade. */
export class RecepcaoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly painelRecepcao: PainelRecepcaoUseCase;

  constructor(dependencies: RecepcaoControllerDependencies) {
    super();
    this.painelRecepcao = dependencies.painelRecepcao;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    if (request.method !== 'GET') {
      return HttpResponse.badRequest({ message: 'Rota não suportada' });
    }

    const unidadeId = textoQuery({ query: request.query, chave: 'unidadeId' });
    if (!unidadeId) return HttpResponse.badRequest({ message: 'Informe a unidade' });

    const resultado = await this.painelRecepcao.execute({
      redeId: request.usuario.redeId,
      unidadeId,
      data: textoQuery({ query: request.query, chave: 'data' }) ?? new Date().toISOString(),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
