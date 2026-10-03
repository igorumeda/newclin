import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import type {
  CancelarNotificacoesAgendamentoInputDto,
  CancelarNotificacoesAgendamentoOutputDto,
} from '../../dtos/notificacao.dto';

export type CancelarNotificacoesAgendamentoDependencies = {
  notificacaoRepository: INotificacaoRepository;
};

/**
 * Cancelamento em cascata: ao cancelar um agendamento, lembretes e confirmações
 * pendentes não devem mais ser enviados (§4.2).
 */
export class CancelarNotificacoesAgendamentoUseCase extends UseCase<
  CancelarNotificacoesAgendamentoInputDto,
  CancelarNotificacoesAgendamentoOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;

  constructor(dependencies: CancelarNotificacoesAgendamentoDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
  }

  async execute(
    input: CancelarNotificacoesAgendamentoInputDto,
  ): Promise<Result<CancelarNotificacoesAgendamentoOutputDto>> {
    const canceladas = await this.notificacaoRepository.cancelarPorAgendamento({
      agendamentoId: input.agendamentoId,
      motivo: input.motivo ?? 'Agendamento cancelado',
      ignorarTipos: input.ignorarTipos,
    });

    return Result.ok({ canceladas });
  }
}
