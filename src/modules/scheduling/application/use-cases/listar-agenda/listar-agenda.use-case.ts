import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import type { ListarAgendaInputDto, ListarAgendaOutputDto } from '../../dtos/agenda.dto';

export type ListarAgendaDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
};

/** Visão diária/semanal: agenda por profissional + unidade + período (§3.4). */
export class ListarAgendaUseCase extends UseCase<ListarAgendaInputDto, ListarAgendaOutputDto> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: ListarAgendaDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarAgendaInputDto): Promise<Result<ListarAgendaOutputDto>> {
    const { items, total } = await this.agendamentoRepository.listar({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: input.profissionalId ?? null,
      pacienteId: input.pacienteId ?? null,
      de: input.de,
      ate: input.ate,
      status: input.status ?? null,
      incluirCancelados: input.incluirCancelados ?? false,
      page: input.page ?? 1,
      perPage: input.perPage ?? 200,
    });

    const enriquecimentos = await this.enricher.enriquecerLote({
      agendamentos: items,
      redeId: input.redeId,
    });

    return Result.ok({
      items: items.map((agendamento) =>
        this.mapper.map({
          agendamento,
          enriquecimento: enriquecimentos.get(agendamento.id.toString()),
        }),
      ),
      total,
    });
  }
}
