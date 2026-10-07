import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AgendamentoNaoEncontradoError } from '../../../domain/errors/agendamento-nao-encontrado.error';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import { AgendamentoMapper } from '../../mappers/agendamento.mapper';
import type { AgendamentoOutputDto } from '../../mappers/agendamento.output.dto';
import type { RegistrarCheckinInputDto } from './registrar-checkin.input.dto';

export type RegistrarCheckinDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  mapper: AgendamentoMapper;
};

export class RegistrarCheckinUseCase extends UseCase<
  RegistrarCheckinInputDto,
  AgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: RegistrarCheckinDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: RegistrarCheckinInputDto): Promise<Result<AgendamentoOutputDto>> {
    const agendamento = await this.agendamentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!agendamento) {
      return Result.fail(new AgendamentoNaoEncontradoError({ agendamentoId: input.id }));
    }

    const ordemChegada = await this.agendamentoRepository.proximaOrdemChegada({
      redeId: input.redeId,
      unidadeId: agendamento.unidadeId,
      data: agendamento.periodo.inicio.toISOString(),
    });

    const checkin = agendamento.registrarCheckin({ ordemChegada });
    if (checkin.isFailure) return Result.propagate(checkin);

    await this.agendamentoRepository.atualizar(agendamento);
    return Result.ok(this.mapper.map({ agendamento }));
  }
}
