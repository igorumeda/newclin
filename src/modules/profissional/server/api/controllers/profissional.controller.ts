import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { booleanoQuery, corpo, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { AlternarStatusProfissionalUseCase } from '../../../application/use-cases/alternar-status-profissional/alternar-status-profissional.use-case';
import type { AtualizarProfissionalUseCase } from '../../../application/use-cases/atualizar-profissional/atualizar-profissional.use-case';
import type { CriarProfissionalUseCase } from '../../../application/use-cases/criar-profissional/criar-profissional.use-case';
import type { DefinirHorariosUseCase } from '../../../application/use-cases/definir-horarios/definir-horarios.use-case';
import type { HorarioInputDto } from '../../../application/use-cases/definir-horarios/definir-horarios.input.dto';
import type { ListarProfissionaisUseCase } from '../../../application/use-cases/listar-profissionais/listar-profissionais.use-case';

export type ProfissionalControllerDependencies = {
  listarProfissionais: ListarProfissionaisUseCase;
  criarProfissional: CriarProfissionalUseCase;
  atualizarProfissional: AtualizarProfissionalUseCase;
  alternarStatusProfissional: AlternarStatusProfissionalUseCase;
  definirHorarios: DefinirHorariosUseCase;
};

export class ProfissionalController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarProfissionais: ListarProfissionaisUseCase;
  private readonly criarProfissional: CriarProfissionalUseCase;
  private readonly atualizarProfissional: AtualizarProfissionalUseCase;
  private readonly alternarStatusProfissional: AlternarStatusProfissionalUseCase;
  private readonly definirHorarios: DefinirHorariosUseCase;

  constructor(dependencies: ProfissionalControllerDependencies) {
    super();
    this.listarProfissionais = dependencies.listarProfissionais;
    this.criarProfissional = dependencies.criarProfissional;
    this.atualizarProfissional = dependencies.atualizarProfissional;
    this.alternarStatusProfissional = dependencies.alternarStatusProfissional;
    this.definirHorarios = dependencies.definirHorarios;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;
    const recurso = request.params.recurso;

    if (request.method === 'GET' && !id) return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'PUT' && id && recurso === 'horarios') return this.horarios(request);
    if (request.method === 'PATCH' && id) return this.atualizar(request);
    if (request.method === 'DELETE' && id) return this.desativar(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarProfissionais.execute({
      redeId: request.usuario!.redeId,
      busca: textoQuery({ query: request.query, chave: 'busca' }) ?? undefined,
      unidadeId: textoQuery({ query: request.query, chave: 'unidadeId' }),
      apenasAtivos: booleanoQuery({ query: request.query, chave: 'apenasAtivos' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarProfissional.execute({
      redeId: request.usuario!.redeId,
      nome: String(dados.nome ?? ''),
      cpf: dados.cpf as string | null | undefined,
      email: dados.email as string | null | undefined,
      telefone: dados.telefone as string | null | undefined,
      conselho: String(dados.conselho ?? ''),
      numeroConselho: String(dados.numeroConselho ?? ''),
      ufConselho: dados.ufConselho as string | null | undefined,
      especialidade: String(dados.especialidade ?? ''),
      corAgenda: dados.corAgenda as string | undefined,
      unidades: dados.unidades as string[] | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    if (dados.ativo !== undefined) {
      const status = await this.alternarStatusProfissional.execute({
        redeId: request.usuario!.redeId,
        id: request.params.id,
        ativo: Boolean(dados.ativo),
      });
      if (status.isFailure) return mapDomainErrorToHttp({ error: status.error });
      return HttpResponse.ok({ data: status.value });
    }

    const resultado = await this.atualizarProfissional.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      nome: dados.nome as string | undefined,
      cpf: dados.cpf as string | null | undefined,
      email: dados.email as string | null | undefined,
      telefone: dados.telefone as string | null | undefined,
      conselho: dados.conselho as string | undefined,
      numeroConselho: dados.numeroConselho as string | undefined,
      ufConselho: dados.ufConselho as string | null | undefined,
      especialidade: dados.especialidade as string | undefined,
      corAgenda: dados.corAgenda as string | undefined,
      unidades: dados.unidades as string[] | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async horarios(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.definirHorarios.execute({
      redeId: request.usuario!.redeId,
      profissionalId: request.params.id,
      horarios: (dados.horarios as HorarioInputDto[] | undefined) ?? [],
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async desativar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.alternarStatusProfissional.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      ativo: false,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
