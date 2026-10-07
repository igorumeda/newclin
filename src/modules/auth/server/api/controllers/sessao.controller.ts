import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { corpo } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import type { AutenticarUsuarioUseCase } from '../../../application/use-cases/autenticar-usuario/autenticar-usuario.use-case';

export type SessaoControllerDependencies = { autenticarUsuario: AutenticarUsuarioUseCase };

/** POST /api/v1/sessao (login) · GET /api/v1/sessao (sessão atual). */
export class SessaoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly autenticarUsuario: AutenticarUsuarioUseCase;

  constructor(dependencies: SessaoControllerDependencies) {
    super();
    this.autenticarUsuario = dependencies.autenticarUsuario;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (request.method === 'POST') return this.autenticar(request);
    if (request.method === 'GET') return this.sessaoAtual(request);
    return HttpResponse.badRequest({ message: 'Método não suportado' });
  }

  private async autenticar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.autenticarUsuario.execute({
      email: String(dados.email ?? ''),
      senha: String(dados.senha ?? ''),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async sessaoAtual(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    return HttpResponse.ok({ data: request.usuario });
  }
}
