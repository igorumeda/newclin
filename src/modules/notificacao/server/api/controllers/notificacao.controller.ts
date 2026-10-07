import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo, numeroQuery, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { StatusNotificacao } from '../../../domain/entities/notificacao.entity';
import type { CanalNotificacaoValue } from '../../../domain/value-objects/canal-notificacao.vo';
import type { TipoNotificacaoValue } from '../../../domain/value-objects/tipo-notificacao.vo';
import type { AgendarNotificacaoUseCase } from '../../../application/use-cases/agendar-notificacao/agendar-notificacao.use-case';
import type { ListarNotificacoesUseCase } from '../../../application/use-cases/listar-notificacoes/listar-notificacoes.use-case';

export type NotificacaoControllerDependencies = {
  listarNotificacoes: ListarNotificacoesUseCase;
  agendarNotificacao: AgendarNotificacaoUseCase;
};

export class NotificacaoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarNotificacoes: ListarNotificacoesUseCase;
  private readonly agendarNotificacao: AgendarNotificacaoUseCase;

  constructor(dependencies: NotificacaoControllerDependencies) {
    super();
    this.listarNotificacoes = dependencies.listarNotificacoes;
    this.agendarNotificacao = dependencies.agendarNotificacao;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    if (request.method === 'GET') return this.listar(request);
    if (request.method === 'POST') return this.agendar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarNotificacoes.execute({
      redeId: request.usuario!.redeId,
      canal: textoQuery({ query: request.query, chave: 'canal' }) as CanalNotificacaoValue | null,
      status: textoQuery({ query: request.query, chave: 'status' }) as StatusNotificacao | null,
      limite: numeroQuery({ query: request.query, chave: 'limite' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async agendar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.agendarNotificacao.execute({
      redeId: request.usuario!.redeId,
      agendamentoId: String(dados.agendamentoId ?? ''),
      tipo: String(dados.tipo ?? 'confirmacao_agendamento') as TipoNotificacaoValue,
      canais: dados.canais as CanalNotificacaoValue[] | undefined,
      agendadaPara: dados.agendadaPara as string | null | undefined,
      motivo: dados.motivo as string | null | undefined,
      evitarDuplicidade: dados.evitarDuplicidade as boolean | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }
}
