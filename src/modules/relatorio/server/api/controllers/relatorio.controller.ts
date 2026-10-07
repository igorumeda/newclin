import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { textoQuery } from '@/server/api/request-parser';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { ObterIndicadoresUseCase } from '../../../application/use-cases/obter-indicadores/obter-indicadores.use-case';
import type { RelatorioAtendimentosUseCase } from '../../../application/use-cases/relatorio-atendimentos/relatorio-atendimentos.use-case';
import type { RelatorioFaltasUseCase } from '../../../application/use-cases/relatorio-faltas/relatorio-faltas.use-case';
import type { RelatorioNovosPacientesUseCase } from '../../../application/use-cases/relatorio-novos-pacientes/relatorio-novos-pacientes.use-case';
import type { RelatorioProdutividadeUseCase } from '../../../application/use-cases/relatorio-produtividade/relatorio-produtividade.use-case';

export type RelatorioControllerDependencies = {
  obterIndicadores: ObterIndicadoresUseCase;
  relatorioAtendimentos: RelatorioAtendimentosUseCase;
  relatorioFaltas: RelatorioFaltasUseCase;
  relatorioNovosPacientes: RelatorioNovosPacientesUseCase;
  relatorioProdutividade: RelatorioProdutividadeUseCase;
};

type PeriodoRequisicao = { inicio: string; fim: string };

const DIAS_PADRAO = 30;

/** GET /api/v1/relatorios/[recurso]. */
export class RelatorioController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly obterIndicadores: ObterIndicadoresUseCase;
  private readonly relatorioAtendimentos: RelatorioAtendimentosUseCase;
  private readonly relatorioFaltas: RelatorioFaltasUseCase;
  private readonly relatorioNovosPacientes: RelatorioNovosPacientesUseCase;
  private readonly relatorioProdutividade: RelatorioProdutividadeUseCase;

  constructor(dependencies: RelatorioControllerDependencies) {
    super();
    this.obterIndicadores = dependencies.obterIndicadores;
    this.relatorioAtendimentos = dependencies.relatorioAtendimentos;
    this.relatorioFaltas = dependencies.relatorioFaltas;
    this.relatorioNovosPacientes = dependencies.relatorioNovosPacientes;
    this.relatorioProdutividade = dependencies.relatorioProdutividade;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    if (request.method !== 'GET') {
      return HttpResponse.badRequest({ message: 'Rota não suportada' });
    }

    const recurso = request.params.recurso ?? 'indicadores';
    const unidadeId = textoQuery({ query: request.query, chave: 'unidadeId' });
    const periodo = this.periodo(request);

    switch (recurso) {
      case 'indicadores': {
        const resultado = await this.obterIndicadores.execute({
          redeId: request.usuario.redeId,
          unidadeId,
          referencia: textoQuery({ query: request.query, chave: 'referencia' }),
        });
        if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
        return HttpResponse.ok({ data: resultado.value });
      }
      case 'atendimentos': {
        const resultado = await this.relatorioAtendimentos.execute({
          redeId: request.usuario.redeId,
          unidadeId,
          profissionalId: textoQuery({ query: request.query, chave: 'profissionalId' }),
          ...periodo,
        });
        if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
        return HttpResponse.ok({ data: resultado.value });
      }
      case 'faltas': {
        const resultado = await this.relatorioFaltas.execute({
          redeId: request.usuario.redeId,
          unidadeId,
          profissionalId: textoQuery({ query: request.query, chave: 'profissionalId' }),
          ...periodo,
        });
        if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
        return HttpResponse.ok({ data: resultado.value });
      }
      case 'novos-pacientes': {
        const resultado = await this.relatorioNovosPacientes.execute({
          redeId: request.usuario.redeId,
          unidadeId,
          ...periodo,
        });
        if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
        return HttpResponse.ok({ data: resultado.value });
      }
      case 'produtividade': {
        const resultado = await this.relatorioProdutividade.execute({
          redeId: request.usuario.redeId,
          unidadeId,
          ...periodo,
        });
        if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
        return HttpResponse.ok({ data: resultado.value });
      }
      default:
        return HttpResponse.notFound({ message: 'Relatório não encontrado' });
    }
  }

  private periodo(request: HttpRequest): PeriodoRequisicao {
    const fim = textoQuery({ query: request.query, chave: 'fim' }) ?? new Date().toISOString();
    const inicioPadrao = new Date(
      new Date(fim).getTime() - DIAS_PADRAO * 24 * 3_600_000,
    ).toISOString();
    return {
      inicio: textoQuery({ query: request.query, chave: 'inicio' }) ?? inicioPadrao,
      fim,
    };
  }
}
