import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { AtualizarRedeUseCase } from '../../../application/use-cases/atualizar-rede/atualizar-rede.use-case';
import type { AtualizarTemaUseCase } from '../../../application/use-cases/atualizar-tema/atualizar-tema.use-case';
import type { ObterRedeUseCase } from '../../../application/use-cases/obter-rede/obter-rede.use-case';
import type { TemaCores } from '../../../domain/value-objects/tema.vo';
import type { RedeConfig } from '../../../domain/entities/rede.entity';

export type RedeControllerDependencies = {
  obterRede: ObterRedeUseCase;
  atualizarRede: AtualizarRedeUseCase;
  atualizarTema: AtualizarTemaUseCase;
};

/** GET/PATCH /api/v1/rede · PATCH /api/v1/rede/tema. */
export class RedeController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly obterRede: ObterRedeUseCase;
  private readonly atualizarRede: AtualizarRedeUseCase;
  private readonly atualizarTema: AtualizarTemaUseCase;

  constructor(dependencies: RedeControllerDependencies) {
    super();
    this.obterRede = dependencies.obterRede;
    this.atualizarRede = dependencies.atualizarRede;
    this.atualizarTema = dependencies.atualizarTema;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const recurso = request.params.recurso;

    if (request.method === 'GET') return this.obter(request);
    if (request.method === 'PATCH' && recurso === 'tema') return this.alterarTema(request);
    if (request.method === 'PATCH') return this.atualizar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async obter(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.obterRede.execute({ redeId: request.usuario!.redeId });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.atualizarRede.execute({
      redeId: request.usuario!.redeId,
      nome: dados.nome as string | undefined,
      cnpj: dados.cnpj as string | null | undefined,
      logotipoUrl: dados.logotipoUrl as string | null | undefined,
      config: dados.config as Partial<RedeConfig> | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async alterarTema(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.atualizarTema.execute({
      redeId: request.usuario!.redeId,
      preset: dados.preset as string | undefined,
      cores: dados.cores as Partial<TemaCores> | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
