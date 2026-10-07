import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { ConteudoDocumento } from '../../../domain/entities/documento.entity';
import type { TipoDocumentoValue } from '../../../domain/value-objects/tipo-documento.vo';
import type { CriarDocumentoUseCase } from '../../../application/use-cases/criar-documento/criar-documento.use-case';
import type { EmitirDocumentoUseCase } from '../../../application/use-cases/emitir-documento/emitir-documento.use-case';
import type { ListarDocumentosUseCase } from '../../../application/use-cases/listar-documentos/listar-documentos.use-case';
import type { ObterDocumentoUseCase } from '../../../application/use-cases/obter-documento/obter-documento.use-case';

export type DocumentoControllerDependencies = {
  listarDocumentos: ListarDocumentosUseCase;
  obterDocumento: ObterDocumentoUseCase;
  criarDocumento: CriarDocumentoUseCase;
  emitirDocumento: EmitirDocumentoUseCase;
};

export class DocumentoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarDocumentos: ListarDocumentosUseCase;
  private readonly obterDocumento: ObterDocumentoUseCase;
  private readonly criarDocumento: CriarDocumentoUseCase;
  private readonly emitirDocumento: EmitirDocumentoUseCase;

  constructor(dependencies: DocumentoControllerDependencies) {
    super();
    this.listarDocumentos = dependencies.listarDocumentos;
    this.obterDocumento = dependencies.obterDocumento;
    this.criarDocumento = dependencies.criarDocumento;
    this.emitirDocumento = dependencies.emitirDocumento;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;
    const recurso = request.params.recurso;

    if (request.method === 'GET' && id) return this.obter(request);
    if (request.method === 'GET') return this.listar(request);
    if (request.method === 'POST' && id && recurso === 'emitir') return this.emitir(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarDocumentos.execute({
      redeId: request.usuario!.redeId,
      pacienteId: textoQuery({ query: request.query, chave: 'pacienteId' }),
      atendimentoId: textoQuery({ query: request.query, chave: 'atendimentoId' }),
      tipo: textoQuery({ query: request.query, chave: 'tipo' }) as TipoDocumentoValue | null,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async obter(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.obterDocumento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarDocumento.execute({
      redeId: request.usuario!.redeId,
      unidadeId: String(dados.unidadeId ?? ''),
      pacienteId: String(dados.pacienteId ?? ''),
      atendimentoId: dados.atendimentoId as string | null | undefined,
      profissionalId: String(dados.profissionalId ?? request.usuario!.profissionalId ?? ''),
      tipo: String(dados.tipo ?? ''),
      conteudo: (dados.conteudo as ConteudoDocumento | undefined) ?? {},
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async emitir(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.emitirDocumento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      conteudo: dados.conteudo as ConteudoDocumento | undefined,
      emitidoPor: request.usuario!.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
