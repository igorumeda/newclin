import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import {
  AgendamentoNotFoundError,
  InvalidSchedulingOperationError,
} from '../../../domain/errors/agendamento.errors';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { IEstadoAgendamentoPort } from '../../../domain/services/agenda-status.port';
import type { Agendamento } from '../../../domain/entities/agendamento.entity';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import type {
  AlterarStatusAgendamentoInputDto,
  AlterarStatusAgendamentoOutputDto,
} from '../../dtos/agenda.dto';

export type AlterarStatusAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
  statusPort: IEstadoAgendamentoPort;
};

/**
 * Fluxo de status do §3.4 em um único ponto de entrada:
 *   confirmar / aguardando (check-in) / iniciar / finalizar / faltou / cancelar.
 * A transição inválida é bloqueada no domínio e no banco.
 */
export class AlterarStatusAgendamentoUseCase extends UseCase<
  AlterarStatusAgendamentoInputDto,
  AlterarStatusAgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;
  private readonly statusPort: IEstadoAgendamentoPort;

  constructor(dependencies: AlterarStatusAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
    this.statusPort = dependencies.statusPort;
  }

  async execute(
    input: AlterarStatusAgendamentoInputDto,
  ): Promise<Result<AlterarStatusAgendamentoOutputDto>> {
    const agendamento = await this.agendamentoRepository.findById(input.agendamentoId);
    if (!agendamento) {
      return Result.fail(new AgendamentoNotFoundError({ agendamentoId: input.agendamentoId }));
    }

    const transicao = this.aplicarTransicao({
      agendamentoStatus: agendamento.status,
      agendamento,
      input,
    });
    if (transicao.isFailure) return Result.fail(transicao.error);

    await this.agendamentoRepository.update(agendamento);

    if (agendamento.status === 'cancelado') {
      await this.statusPort.aoCancelar({
        agendamentoId: agendamento.id.toString(),
        motivo: agendamento.motivoCancelamento ?? input.motivo ?? 'Cancelado',
        agendamento,
      });
    }

    const enriquecimento = await this.enricher.enriquecerUm({
      agendamento,
      redeId: agendamento.redeId,
    });

    return Result.ok(this.mapper.map({ agendamento, enriquecimento }));
  }

  private aplicarTransicao(params: {
    agendamentoStatus: string;
    agendamento: Agendamento;
    input: AlterarStatusAgendamentoInputDto;
  }): Result<void> {
    const { agendamento, input } = params;

    switch (input.novoStatus) {
      case 'confirmado':
        return agendamento.confirmar({ por: input.por ?? 'recepcao' });
      case 'aguardando':
        return agendamento.registrarChegada();
      case 'em_atendimento':
        return agendamento.iniciarAtendimento();
      case 'finalizado':
        return agendamento.finalizar();
      case 'faltou':
        return agendamento.registrarFalta();
      case 'cancelado':
        return agendamento.cancelar({ motivo: input.motivo ?? 'Cancelado pelo painel' });
      case 'agendado':
        return Result.fail(
          new InvalidSchedulingOperationError({
            reason: 'Não é possível retornar um agendamento para "agendado"',
          }),
        );
    }
  }
}
