import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AgendamentoNotFoundError } from '../../../domain/errors/agendamento.errors';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { IAgendaNotificacaoPort } from '../../../domain/services/agenda-notificacao.interface';
import type { IEstadoAgendamentoPort } from '../../../domain/services/agenda-status.port';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IRedeLookup } from '@/modules/organization/domain/services/rede-lookup.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import { montarDadosNotificacao } from '../../services/agendamento-notificacao.factory';
import type {
  CancelarAgendamentoInputDto,
  CancelarAgendamentoOutputDto,
} from '../../dtos/agenda.dto';

export type CancelarAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
  statusPort: IEstadoAgendamentoPort;
  notificacao: IAgendaNotificacaoPort | null;
  unidadeLookup: IUnidadeLookup;
  redeLookup: IRedeLookup;
};

/**
 * Cancelamento com motivo obrigatório (§3.4):
 * descarta lembretes/confirmações pendentes e avisa o paciente.
 */
export class CancelarAgendamentoUseCase extends UseCase<
  CancelarAgendamentoInputDto,
  CancelarAgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;
  private readonly statusPort: IEstadoAgendamentoPort;
  private readonly notificacao: IAgendaNotificacaoPort | null;
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly redeLookup: IRedeLookup;

  constructor(dependencies: CancelarAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
    this.statusPort = dependencies.statusPort;
    this.notificacao = dependencies.notificacao;
    this.unidadeLookup = dependencies.unidadeLookup;
    this.redeLookup = dependencies.redeLookup;
  }

  async execute(input: CancelarAgendamentoInputDto): Promise<Result<CancelarAgendamentoOutputDto>> {
    const agendamento = await this.agendamentoRepository.findById(input.agendamentoId);
    if (!agendamento) {
      return Result.fail(new AgendamentoNotFoundError({ agendamentoId: input.agendamentoId }));
    }

    const cancelamento = agendamento.cancelar({
      motivo: input.motivo,
      canceladoPor: input.canceladoPor,
    });
    if (cancelamento.isFailure) return Result.fail(cancelamento.error);

    await this.agendamentoRepository.update(agendamento);

    await this.statusPort.aoCancelar({
      agendamentoId: agendamento.id.toString(),
      motivo: input.motivo,
      agendamento,
    });

    const enriquecimento = await this.enricher.enriquecerUm({
      agendamento,
      redeId: agendamento.redeId,
    });

    if (this.notificacao) {
      const [unidade, rede] = await Promise.all([
        this.unidadeLookup.findById(agendamento.unidadeId),
        this.redeLookup.findById(agendamento.redeId),
      ]);

      await this.notificacao.cancelamentoAgendamento(
        montarDadosNotificacao({
          agendamento,
          enriquecimento,
          unidade,
          redeNome: rede?.nome ?? 'Clínica',
          createdBy: input.canceladoPor,
        }),
        input.motivo,
      );
    }

    return Result.ok(this.mapper.map({ agendamento, enriquecimento }));
  }
}
