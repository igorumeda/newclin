import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { ListarAnexosUseCase } from '../../../application/use-cases/listar-anexos/listar-anexos.use-case';
import type { RegistrarAnexoUseCase } from '../../../application/use-cases/registrar-anexo/registrar-anexo.use-case';
import type { RemoverAnexoUseCase } from '../../../application/use-cases/remover-anexo/remover-anexo.use-case';

export type AnexoControllerDependencies = {
  listarAnexos: ListarAnexosUseCase;
  registrarAnexo: RegistrarAnexoUseCase;
  removerAnexo: RemoverAnexoUseCase;
};

export class AnexoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarAnexos: ListarAnexosUseCase;
  private readonly registrarAnexo: RegistrarAnexoUseCase;
  private readonly removerAnexo: RemoverAnexoUseCase;

  constructor(dependencies: AnexoControllerDependencies) {
    super();
    this.listarAnexos = dependencies.listarAnexos;
    this.registrarAnexo = dependencies.registrarAnexo;
    this.removerAnexo = dependencies.removerAnexo;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;

    if (request.method === 'GET' && !id) return this.listar(request);
    if (request.method === 'POST' && !id) return this.registrar(request);
    if (request.method === 'DELETE' && id) return this.remover(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarAnexos.execute({
      redeId: request.usuario!.redeId,
      pacienteId: textoQuery({ query: request.query, chave: 'pacienteId' }),
      atendimentoId: textoQuery({ query: request.query, chave: 'atendimentoId' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async registrar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.registrarAnexo.execute({
      redeId: request.usuario!.redeId,
      pacienteId: String(dados.pacienteId ?? ''),
      atendimentoId: dados.atendimentoId as string | null | undefined,
      nomeArquivo: String(dados.nomeArquivo ?? ''),
      mimeType: String(dados.mimeType ?? ''),
      tamanhoBytes: Number(dados.tamanhoBytes ?? 0),
      storageKey: String(dados.storageKey ?? ''),
      descricao: dados.descricao as string | null | undefined,
      enviadoPor: request.usuario!.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async remover(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.removerAnexo.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.noContent();
  }
}
