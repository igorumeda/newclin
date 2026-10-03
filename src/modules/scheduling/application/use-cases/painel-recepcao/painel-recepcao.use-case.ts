import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import type { PainelRecepcaoInputDto, PainelRecepcaoOutputDto } from '../../dtos/agenda.dto';

export type PainelRecepcaoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  unidadeLookup: IUnidadeLookup;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
};

/**
 * Painel de recepção (§3.4): lista do dia da unidade com status, tempo de
 * espera e ordem de chegada — é a tela de trabalho da recepção.
 */
export class PainelRecepcaoUseCase extends UseCase<PainelRecepcaoInputDto, PainelRecepcaoOutputDto> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: PainelRecepcaoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.unidadeLookup = dependencies.unidadeLookup;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
  }

  async execute(input: PainelRecepcaoInputDto): Promise<Result<PainelRecepcaoOutputDto>> {
    const unidade = await this.unidadeLookup.findById(input.unidadeId);
    const timezone = unidade?.timezone ?? 'America/Sao_Paulo';
    const referencia = new Date();
    const data = input.data ?? formatInTimeZone(referencia, timezone, 'yyyy-MM-dd');

    const { items } = await this.agendamentoRepository.listar({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      de: fromZonedTime(`${data}T00:00:00`, timezone).toISOString(),
      ate: fromZonedTime(`${data}T23:59:59.999`, timezone).toISOString(),
      incluirCancelados: false,
      page: 1,
      perPage: 500,
    });

    const enriquecimentos = await this.enricher.enriquecerLote({
      agendamentos: items,
      redeId: input.redeId,
    });

    const dtos = items.map((agendamento) =>
      this.mapper.map({
        agendamento,
        enriquecimento: enriquecimentos.get(agendamento.id.toString()),
        referencia,
      }),
    );

    const ordenarPorHorario = (a: { inicio: string }, b: { inicio: string }) =>
      a.inicio.localeCompare(b.inicio);
    const ordenarPorChegada = (a: { ordemChegada: number | null }) => a.ordemChegada ?? Number.MAX_SAFE_INTEGER;

    const aguardando = dtos.filter((item) => item.status === 'aguardando').sort((a, b) => ordenarPorChegada(a) - ordenarPorChegada(b));
    const emAtendimento = dtos.filter((item) => item.status === 'em_atendimento').sort(ordenarPorChegada);
    const aChegar = dtos
      .filter((item) => item.status === 'agendado' || item.status === 'confirmado')
      .sort(ordenarPorHorario);
    const finalizados = dtos.filter((item) => item.status === 'finalizado').sort(ordenarPorHorario);
    const ausentes = dtos.filter((item) => item.status === 'faltou').sort(ordenarPorHorario);

    const temposDeEspera = aguardando
      .map((item) => item.tempoEsperaMinutos)
      .filter((tempo): tempo is number => tempo !== null);

    return Result.ok({
      data,
      unidadeId: input.unidadeId,
      aguardando,
      emAtendimento,
      aChegar,
      finalizados,
      ausentes,
      indicadores: {
        total: dtos.length,
        confirmados: dtos.filter((item) => item.status === 'confirmado').length,
        aguardando: aguardando.length,
        emAtendimento: emAtendimento.length,
        finalizados: finalizados.length,
        faltas: ausentes.length,
        tempoMedioEsperaMinutos:
          temposDeEspera.length > 0
            ? Math.round(temposDeEspera.reduce((total, tempo) => total + tempo, 0) / temposDeEspera.length)
            : 0,
      },
    });
  }
}
