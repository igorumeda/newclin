import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { booleanoQuery, corpo, numeroQuery, textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { EnderecoPaciente } from '../../../domain/entities/paciente.entity';
import type { AlternarStatusPacienteUseCase } from '../../../application/use-cases/alternar-status-paciente/alternar-status-paciente.use-case';
import type { AtualizarPacienteUseCase } from '../../../application/use-cases/atualizar-paciente/atualizar-paciente.use-case';
import type { CriarPacienteUseCase } from '../../../application/use-cases/criar-paciente/criar-paciente.use-case';
import type { ExportarPacienteUseCase } from '../../../application/use-cases/exportar-paciente/exportar-paciente.use-case';
import type { ListarPacientesUseCase } from '../../../application/use-cases/listar-pacientes/listar-pacientes.use-case';
import type { ObterPacienteUseCase } from '../../../application/use-cases/obter-paciente/obter-paciente.use-case';

export type PacienteControllerDependencies = {
  listarPacientes: ListarPacientesUseCase;
  obterPaciente: ObterPacienteUseCase;
  criarPaciente: CriarPacienteUseCase;
  atualizarPaciente: AtualizarPacienteUseCase;
  alternarStatusPaciente: AlternarStatusPacienteUseCase;
  exportarPaciente: ExportarPacienteUseCase;
};

export class PacienteController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly listarPacientes: ListarPacientesUseCase;
  private readonly obterPaciente: ObterPacienteUseCase;
  private readonly criarPaciente: CriarPacienteUseCase;
  private readonly atualizarPaciente: AtualizarPacienteUseCase;
  private readonly alternarStatusPaciente: AlternarStatusPacienteUseCase;
  private readonly exportarPaciente: ExportarPacienteUseCase;

  constructor(dependencies: PacienteControllerDependencies) {
    super();
    this.listarPacientes = dependencies.listarPacientes;
    this.obterPaciente = dependencies.obterPaciente;
    this.criarPaciente = dependencies.criarPaciente;
    this.atualizarPaciente = dependencies.atualizarPaciente;
    this.alternarStatusPaciente = dependencies.alternarStatusPaciente;
    this.exportarPaciente = dependencies.exportarPaciente;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    const id = request.params.id;
    const recurso = request.params.recurso;

    if (request.method === 'GET' && id && recurso === 'exportar') return this.exportar(request);
    if (request.method === 'GET' && id) return this.obter(request);
    if (request.method === 'GET') return this.listar(request);
    if (request.method === 'POST' && !id) return this.criar(request);
    if (request.method === 'PATCH' && id) return this.atualizar(request);
    if (request.method === 'DELETE' && id) return this.excluir(request);
    return HttpResponse.badRequest({ message: 'Rota não suportada' });
  }

  private async listar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.listarPacientes.execute({
      redeId: request.usuario!.redeId,
      busca: textoQuery({ query: request.query, chave: 'busca' }) ?? undefined,
      apenasAtivos: booleanoQuery({ query: request.query, chave: 'apenasAtivos' }),
      page: numeroQuery({ query: request.query, chave: 'pagina' }),
      perPage: numeroQuery({ query: request.query, chave: 'porPagina' }),
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value.items, meta: { ...resultado.value.meta } });
  }

  private async obter(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.obterPaciente.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async exportar(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.exportarPaciente.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async criar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    const resultado = await this.criarPaciente.execute({
      redeId: request.usuario!.redeId,
      nome: String(dados.nome ?? ''),
      cpf: String(dados.cpf ?? ''),
      dataNascimento: String(dados.dataNascimento ?? ''),
      sexo: String(dados.sexo ?? ''),
      telefone: dados.telefone as string | null | undefined,
      email: dados.email as string | null | undefined,
      endereco: dados.endereco as Partial<EnderecoPaciente> | undefined,
      responsavelNome: dados.responsavelNome as string | null | undefined,
      responsavelTelefone: dados.responsavelTelefone as string | null | undefined,
      alergias: dados.alergias as string[] | undefined,
      condicoesCronicas: dados.condicoesCronicas as string[] | undefined,
      observacoes: dados.observacoes as string | null | undefined,
      consentimentoLgpd: dados.consentimentoLgpd as boolean | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  private async atualizar(request: HttpRequest): Promise<HttpResponsePayload> {
    const dados = corpo(request.body);
    if (Object.keys(dados).length === 1 && dados.ativo !== undefined) {
      const status = await this.alternarStatusPaciente.execute({
        redeId: request.usuario!.redeId,
        id: request.params.id,
        ativo: Boolean(dados.ativo),
      });
      if (status.isFailure) return mapDomainErrorToHttp({ error: status.error });
      return HttpResponse.ok({ data: status.value });
    }

    const resultado = await this.atualizarPaciente.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      nome: dados.nome as string | undefined,
      cpf: dados.cpf as string | undefined,
      dataNascimento: dados.dataNascimento as string | undefined,
      sexo: dados.sexo as string | undefined,
      telefone: dados.telefone as string | null | undefined,
      email: dados.email as string | null | undefined,
      endereco: dados.endereco as Partial<EnderecoPaciente> | undefined,
      responsavelNome: dados.responsavelNome as string | null | undefined,
      responsavelTelefone: dados.responsavelTelefone as string | null | undefined,
      alergias: dados.alergias as string[] | undefined,
      condicoesCronicas: dados.condicoesCronicas as string[] | undefined,
      observacoes: dados.observacoes as string | null | undefined,
      consentimentoLgpd: dados.consentimentoLgpd as boolean | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }

  private async excluir(request: HttpRequest): Promise<HttpResponsePayload> {
    const resultado = await this.alternarStatusPaciente.execute({
      redeId: request.usuario!.redeId,
      id: request.params.id,
      ativo: false,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.ok({ data: resultado.value });
  }
}
