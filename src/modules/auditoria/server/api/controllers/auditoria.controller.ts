import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { numeroQuery, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { AcaoAuditoria } from '../../../domain/entities/registro-auditoria.entity';
import type { ListarAcessosProntuarioUseCase } from '../../../application/use-cases/listar-acessos-prontuario/listar-acessos-prontuario.use-case';
import type { ListarAuditoriaUseCase } from '../../../application/use-cases/listar-auditoria/listar-auditoria.use-case';

export type AuditoriaControllerDependencies = {
  listarAuditoria: ListarAuditoriaUseCase;
  listarAcessosProntuario: ListarAcessosProntuarioUseCase;
};

export class AuditoriaController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarAuditoria: ListarAuditoriaUseCase;
  private readonly listarAcessosProntuario: ListarAcessosProntuarioUseCase;

  constructor(dependencies: AuditoriaControllerDependencies) {
    super();
    this.listarAuditoria = dependencies.listarAuditoria;
    this.listarAcessosProntuario = dependencies.listarAcessosProntuario;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    if (request.method !== 'GET') {
      return HttpResponse.badRequest({ message: 'Rota não suportada' });
    }
    if (request.params.recurso === 'prontuarios') return this.acessos(request);
    return this.listar(request);
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarAuditoria.execute({
      redeId: request.usuario!.redeId,
      usuarioId: textoQuery({ query: request.query, chave: 'usuarioId' }),
      entidade: textoQuery({ query: request.query, chave: 'entidade' }),
      entidadeId: textoQuery({ query: request.query, chave: 'entidadeId' }),
      acao: textoQuery({ query: request.query, chave: 'acao' }) as AcaoAuditoria | null,
      de: textoQuery({ query: request.query, chave: 'de' }),
      ate: textoQuery({ query: request.query, chave: 'ate' }),
      pagina: numeroQuery({ query: request.query, chave: 'pagina' }),
      porPagina: numeroQuery({ query: request.query, chave: 'porPagina' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value.items, meta: { ...resultado.value.meta } });
  }

  private async acessos(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarAcessosProntuario.execute({
      redeId: request.usuario!.redeId,
      pacienteId: textoQuery({ query: request.query, chave: 'pacienteId' }),
      limite: numeroQuery({ query: request.query, chave: 'limite' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
