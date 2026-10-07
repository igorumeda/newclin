import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo, numeroQuery, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type {
  CamposFixosAtendimento,
  DadosPreenchidos,
  FontePagadora,
} from '../../../domain/entities/atendimento.entity';
import type { AdicionarAdendoUseCase } from '../../../application/use-cases/adicionar-adendo/adicionar-adendo.use-case';
import type { FinalizarAtendimentoUseCase } from '../../../application/use-cases/finalizar-atendimento/finalizar-atendimento.use-case';
import type { IniciarAtendimentoUseCase } from '../../../application/use-cases/iniciar-atendimento/iniciar-atendimento.use-case';
import type { ListarAtendimentosUseCase } from '../../../application/use-cases/listar-atendimentos/listar-atendimentos.use-case';
import type { ObterAtendimentoUseCase } from '../../../application/use-cases/obter-atendimento/obter-atendimento.use-case';
import type { SalvarAtendimentoUseCase } from '../../../application/use-cases/salvar-atendimento/salvar-atendimento.use-case';

export type AtendimentoControllerDependencies = {
  listarAtendimentos: ListarAtendimentosUseCase;
  obterAtendimento: ObterAtendimentoUseCase;
  iniciarAtendimento: IniciarAtendimentoUseCase;
  salvarAtendimento: SalvarAtendimentoUseCase;
  finalizarAtendimento: FinalizarAtendimentoUseCase;
  adicionarAdendo: AdicionarAdendoUseCase;
};

export class AtendimentoController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarAtendimentos: ListarAtendimentosUseCase;
  private readonly obterAtendimento: ObterAtendimentoUseCase;
  private readonly iniciarAtendimento: IniciarAtendimentoUseCase;
  private readonly salvarAtendimento: SalvarAtendimentoUseCase;
  private readonly finalizarAtendimento: FinalizarAtendimentoUseCase;
  private readonly adicionarAdendo: AdicionarAdendoUseCase;

  constructor(dependencies: AtendimentoControllerDependencies) {
    super();
    this.listarAtendimentos = dependencies.listarAtendimentos;
    this.obterAtendimento = dependencies.obterAtendimento;
    this.iniciarAtendimento = dependencies.iniciarAtendimento;
    this.salvarAtendimento = dependencies.salvarAtendimento;
    this.finalizarAtendimento = dependencies.finalizarAtendimento;
    this.adicionarAdendo = dependencies.adicionarAdendo;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;
    const recurso = request.params.recurso;

    if (request.method === 'GET' && id) return this.obter(request);
    if (request.method === 'GET') return this.listar(request);
    if (request.method === 'POST' && !id) return this.iniciar(request);
    if (request.method === 'POST' && id && recurso === 'adendos') return this.adendo(request);
    if (request.method === 'POST' && id && recurso === 'finalizar') return this.finalizar(request);
    if (request.method === 'PATCH' && id) return this.salvar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarAtendimentos.execute({
      redeId: request.usuario!.redeId,
      pacienteId: textoQuery({ query: request.query, chave: 'pacienteId' }),
      profissionalId: textoQuery({ query: request.query, chave: 'profissionalId' }),
      unidadeId: textoQuery({ query: request.query, chave: 'unidadeId' }),
      pagina: numeroQuery({ query: request.query, chave: 'pagina' }),
      porPagina: numeroQuery({ query: request.query, chave: 'porPagina' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value.items, meta: { ...resultado.value.meta } });
  }

  private async obter(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.obterAtendimento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async iniciar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.iniciarAtendimento.execute({
      redeId: request.usuario!.redeId,
      unidadeId: String(dados.unidadeId ?? ''),
      pacienteId: String(dados.pacienteId ?? ''),
      profissionalId: String(dados.profissionalId ?? request.usuario!.profissionalId ?? ''),
      agendamentoId: dados.agendamentoId as string | null | undefined,
      templateId: dados.templateId as string | null | undefined,
      especialidade: dados.especialidade as string | null | undefined,
      fontePagadora: dados.fontePagadora as FontePagadora | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async salvar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.salvarAtendimento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      dadosPreenchidos: dados.dadosPreenchidos as DadosPreenchidos | undefined,
      camposFixos: dados.camposFixos as Partial<CamposFixosAtendimento> | undefined,
      fontePagadora: dados.fontePagadora as FontePagadora | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async finalizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.finalizarAtendimento.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      dadosPreenchidos: dados.dadosPreenchidos as DadosPreenchidos | undefined,
      camposFixos: dados.camposFixos as Partial<CamposFixosAtendimento> | undefined,
      fontePagadora: dados.fontePagadora as FontePagadora | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async adendo(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.adicionarAdendo.execute({
      redeId: request.usuario!.redeId,
      atendimentoId: request.params.id,
      profissionalId: String(dados.profissionalId ?? request.usuario!.profissionalId ?? ''),
      usuarioId: request.usuario!.id,
      conteudo: String(dados.conteudo ?? ''),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }
}
