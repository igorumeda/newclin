import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { booleanoQuery, corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { SecaoTemplateEntrada } from '../../../domain/value-objects/estrutura-template.vo';
import type { AtualizarTemplateUseCase } from '../../../application/use-cases/atualizar-template/atualizar-template.use-case';
import type { CriarTemplateUseCase } from '../../../application/use-cases/criar-template/criar-template.use-case';
import type { ListarTemplatesUseCase } from '../../../application/use-cases/listar-templates/listar-templates.use-case';
import type { ObterTemplateUseCase } from '../../../application/use-cases/obter-template/obter-template.use-case';

export type TemplateControllerDependencies = {
  listarTemplates: ListarTemplatesUseCase;
  obterTemplate: ObterTemplateUseCase;
  criarTemplate: CriarTemplateUseCase;
  atualizarTemplate: AtualizarTemplateUseCase;
};

export class TemplateController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarTemplates: ListarTemplatesUseCase;
  private readonly obterTemplate: ObterTemplateUseCase;
  private readonly criarTemplate: CriarTemplateUseCase;
  private readonly atualizarTemplate: AtualizarTemplateUseCase;

  constructor(dependencies: TemplateControllerDependencies) {
    super();
    this.listarTemplates = dependencies.listarTemplates;
    this.obterTemplate = dependencies.obterTemplate;
    this.criarTemplate = dependencies.criarTemplate;
    this.atualizarTemplate = dependencies.atualizarTemplate;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;

    if (request.method === 'GET' && id) return this.obter(request);
    if (request.method === 'GET') return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'PATCH' && id) return this.atualizar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarTemplates.execute({
      redeId: request.usuario!.redeId,
      especialidade: textoQuery({ query: request.query, chave: 'especialidade' }),
      apenasAtivos: booleanoQuery({ query: request.query, chave: 'apenasAtivos' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async obter(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.obterTemplate.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarTemplate.execute({
      redeId: request.usuario!.redeId,
      nome: String(dados.nome ?? ''),
      especialidade: String(dados.especialidade ?? ''),
      descricao: dados.descricao as string | null | undefined,
      padrao: dados.padrao as boolean | undefined,
      secoes: (dados.secoes as SecaoTemplateEntrada[] | undefined) ?? [],
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.atualizarTemplate.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      nome: dados.nome as string | undefined,
      especialidade: dados.especialidade as string | undefined,
      descricao: dados.descricao as string | null | undefined,
      padrao: dados.padrao as boolean | undefined,
      ativo: dados.ativo as boolean | undefined,
      secoes: dados.secoes as SecaoTemplateEntrada[] | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
