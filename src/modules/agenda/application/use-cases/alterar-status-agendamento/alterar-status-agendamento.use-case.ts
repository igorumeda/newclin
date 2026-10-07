import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AgendamentoNaoEncontradoError } from '../../../domain/errors/agendamento-nao-encontrado.error';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import { AgendamentoMapper } from '../../mappers/agendamento.mapper';
import type { AgendamentoOutputDto } from '../../mappers/agendamento.output.dto';
import type { AlterarStatusAgendamentoInputDto } from './alterar-status-agendamento.input.dto';

export type AlterarStatusAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  mapper: AgendamentoMapper;
};

export class AlterarStatusAgendamentoUseCase extends UseCase<
  AlterarStatusAgendamentoInputDto,
  AgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: AlterarStatusAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AlterarStatusAgendamentoInputDto): Promise<Result<AgendamentoOutputDto>> {
    const agendamento = await this.agendamentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!agendamento) {
      return Result.fail(new AgendamentoNaoEncontradoError({ agendamentoId: input.id }));
    }

    const alteracao = agendamento.alterarStatus({
      destino: input.status,
      motivo: input.motivo ?? null,
    });
    if (alteracao.isFailure) return Result.propagate(alteracao);

    await this.agendamentoRepository.atualizar(agendamento);
    return Result.ok(this.mapper.map({ agendamento }));
  }
}
