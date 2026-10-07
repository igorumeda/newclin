import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { booleanoQuery, corpo } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { AtualizarTipoAtendimentoUseCase } from '../../../application/use-cases/atualizar-tipo-atendimento/atualizar-tipo-atendimento.use-case';
import type { CriarTipoAtendimentoUseCase } from '../../../application/use-cases/criar-tipo-atendimento/criar-tipo-atendimento.use-case';
import type { ListarTiposAtendimentoUseCase } from '../../../application/use-cases/listar-tipos-atendimento/listar-tipos-atendimento.use-case';

export type TipoAtendimentoControllerDependencies = {
  listarTiposAtendimento: ListarTiposAtendimentoUseCase;
  criarTipoAtendimento: CriarTipoAtendimentoUseCase;
  atualizarTipoAtendimento: AtualizarTipoAtendimentoUseCase;
};

export class TipoAtendimentoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarTiposAtendimento: ListarTiposAtendimentoUseCase;
  private readonly criarTipoAtendimento: CriarTipoAtendimentoUseCase;
  private readonly atualizarTipoAtendimento: AtualizarTipoAtendimentoUseCase;

  constructor(dependencies: TipoAtendimentoControllerDependencies) {
    super();
    this.listarTiposAtendimento = dependencies.listarTiposAtendimento;
    this.criarTipoAtendimento = dependencies.criarTipoAtendimento;
    this.atualizarTipoAtendimento = dependencies.atualizarTipoAtendimento;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;

    if (request.method === 'GET' && !id) return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'PATCH' && id) return this.atualizar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarTiposAtendimento.execute({
      redeId: request.usuario!.redeId,
      apenasAtivos: booleanoQuery({ query: request.query, chave: 'apenasAtivos' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarTipoAtendimento.execute({
      redeId: request.usuario!.redeId,
      nome: String(dados.nome ?? ''),
      duracaoMinutos: Number(dados.duracaoMinutos ?? 0),
      cor: dados.cor as string | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.atualizarTipoAtendimento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      nome: dados.nome as string | undefined,
      duracaoMinutos: dados.duracaoMinutos as number | undefined,
      cor: dados.cor as string | undefined,
      ativo: dados.ativo as boolean | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
