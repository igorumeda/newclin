import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo, listaQuery, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { StatusAgendamentoValue } from '../../../domain/value-objects/status-agendamento.vo';
import type { AlterarStatusAgendamentoUseCase } from '../../../application/use-cases/alterar-status-agendamento/alterar-status-agendamento.use-case';
import type { CriarAgendamentoUseCase } from '../../../application/use-cases/criar-agendamento/criar-agendamento.use-case';
import type { ListarAgendamentosUseCase } from '../../../application/use-cases/listar-agendamentos/listar-agendamentos.use-case';
import type { RegistrarCheckinUseCase } from '../../../application/use-cases/registrar-checkin/registrar-checkin.use-case';

export type AgendamentoControllerDependencies = {
  listarAgendamentos: ListarAgendamentosUseCase;
  criarAgendamento: CriarAgendamentoUseCase;
  alterarStatusAgendamento: AlterarStatusAgendamentoUseCase;
  registrarCheckin: RegistrarCheckinUseCase;
};

export class AgendamentoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarAgendamentos: ListarAgendamentosUseCase;
  private readonly criarAgendamento: CriarAgendamentoUseCase;
  private readonly alterarStatusAgendamento: AlterarStatusAgendamentoUseCase;
  private readonly registrarCheckin: RegistrarCheckinUseCase;

  constructor(dependencies: AgendamentoControllerDependencies) {
    super();
    this.listarAgendamentos = dependencies.listarAgendamentos;
    this.criarAgendamento = dependencies.criarAgendamento;
    this.alterarStatusAgendamento = dependencies.alterarStatusAgendamento;
    this.registrarCheckin = dependencies.registrarCheckin;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;
    const recurso = request.params.recurso;

    if (request.method === 'GET' && !id) return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'POST' && id && recurso === 'checkin') return this.checkin(request);
    if (request.method === 'PATCH' && id) return this.alterarStatus(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const inicio = textoQuery({ query: request.query, chave: 'inicio' });
    const fim = textoQuery({ query: request.query, chave: 'fim' });
    if (!inicio || !fim) {
      return HttpResponse.badRequest({ message: 'Informe o período (inicio e fim)' });
    }

    const resultado = await this.listarAgendamentos.execute({
      redeId: request.usuario!.redeId,
      unidadeId: textoQuery({ query: request.query, chave: 'unidadeId' }),
      profissionalId: textoQuery({ query: request.query, chave: 'profissionalId' }),
      pacienteId: textoQuery({ query: request.query, chave: 'pacienteId' }),
      status: listaQuery({ query: request.query, chave: 'status' }) as
        | StatusAgendamentoValue[]
        | null,
      inicio,
      fim,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarAgendamento.execute({
      redeId: request.usuario!.redeId,
      unidadeId: String(dados.unidadeId ?? ''),
      profissionalId: String(dados.profissionalId ?? ''),
      pacienteId: String(dados.pacienteId ?? ''),
      tipoAtendimentoId: String(dados.tipoAtendimentoId ?? ''),
      inicio: String(dados.inicio ?? ''),
      duracaoMinutos: dados.duracaoMinutos as number | null | undefined,
      encaixe: Boolean(dados.encaixe),
      observacoes: dados.observacoes as string | null | undefined,
      criadoPor: request.usuario!.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async alterarStatus(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.alterarStatusAgendamento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      status: String(dados.status ?? ''),
      motivo: dados.motivo as string | null | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async checkin(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.registrarCheckin.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
