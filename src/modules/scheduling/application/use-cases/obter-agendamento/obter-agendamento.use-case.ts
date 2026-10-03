import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AgendamentoNotFoundError } from '../../../domain/errors/agendamento.errors';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import type {
  ObterAgendamentoInputDto,
  ObterAgendamentoOutputDto,
} from '../../dtos/agenda.dto';

export type ObterAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
};

export class ObterAgendamentoUseCase extends UseCase<
  ObterAgendamentoInputDto,
  ObterAgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: ObterAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterAgendamentoInputDto): Promise<Result<ObterAgendamentoOutputDto>> {
    const agendamento = await this.agendamentoRepository.findById(input.agendamentoId);
    if (!agendamento) {
      return Result.fail(new AgendamentoNotFoundError({ agendamentoId: input.agendamentoId }));
    }

    const enriquecimento = await this.enricher.enriquecerUm({
      agendamento,
      redeId: agendamento.redeId,
    });
    const historico = await this.agendamentoRepository.listarHistorico(input.agendamentoId);

    return Result.ok({
      agendamento: this.mapper.map({ agendamento, enriquecimento }),
      historico,
    });
  }
}
