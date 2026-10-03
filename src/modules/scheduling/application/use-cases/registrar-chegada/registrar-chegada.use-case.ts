import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AgendamentoNotFoundError } from '../../../domain/errors/agendamento.errors';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import type { RegistrarChegadaInputDto, RegistrarChegadaOutputDto } from '../../dtos/agenda.dto';

export type RegistrarChegadaDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
};

/**
 * Check-in da recepção (§3.4): registra a chegada (status "aguardando") e a
 * ordem/tempo de espera usados no painel do dia.
 */
export class RegistrarChegadaUseCase extends UseCase<
  RegistrarChegadaInputDto,
  RegistrarChegadaOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: RegistrarChegadaDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
  }

  async execute(input: RegistrarChegadaInputDto): Promise<Result<RegistrarChegadaOutputDto>> {
    const agendamento = await this.agendamentoRepository.findById(input.agendamentoId);
    if (!agendamento) {
      return Result.fail(new AgendamentoNotFoundError({ agendamentoId: input.agendamentoId }));
    }

    const chegada = agendamento.registrarChegada();
    if (chegada.isFailure) return Result.fail(chegada.error);

    await this.agendamentoRepository.update(agendamento);

    const enriquecimento = await this.enricher.enriquecerUm({
      agendamento,
      redeId: agendamento.redeId,
    });

    return Result.ok(this.mapper.map({ agendamento, enriquecimento }));
  }
}
