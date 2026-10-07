import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { BloqueioAgenda } from '../../../domain/entities/bloqueio-agenda.entity';
import { ConflitoAgendaError } from '../../../domain/errors/conflito-agenda.error';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import { BloqueioMapper } from '../../mappers/bloqueio.mapper';
import type { BloqueioOutputDto } from '../../mappers/bloqueio.output.dto';
import type { CriarBloqueioInputDto } from './criar-bloqueio.input.dto';

export type CriarBloqueioDependencies = {
  bloqueioRepository: IBloqueioAgendaRepository;
  agendamentoRepository: IAgendamentoRepository;
  mapper: BloqueioMapper;
};

export class CriarBloqueioUseCase extends UseCase<CriarBloqueioInputDto, BloqueioOutputDto> {
  private readonly bloqueioRepository: IBloqueioAgendaRepository;
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly mapper: BloqueioMapper;

  constructor(dependencies: CriarBloqueioDependencies) {
    super();
    this.bloqueioRepository = dependencies.bloqueioRepository;
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarBloqueioInputDto): Promise<Result<BloqueioOutputDto>> {
    const bloqueioResult = BloqueioAgenda.create({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      profissionalId: input.profissionalId ?? null,
      motivo: input.motivo,
      inicio: input.inicio,
      fim: input.fim,
      criadoPor: input.criadoPor ?? null,
    });
    if (bloqueioResult.isFailure) return Result.propagate(bloqueioResult);

    const bloqueio = bloqueioResult.value;
    const agendamentos = await this.agendamentoRepository.listar({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      profissionalId: input.profissionalId ?? null,
      inicio: bloqueio.periodo.inicio.toISOString(),
      fim: bloqueio.periodo.fim.toISOString(),
      status: ['agendado', 'confirmado', 'aguardando', 'em_atendimento'],
    });

    const impactados = agendamentos.filter((agendamento) =>
      bloqueio.afeta({
        profissionalId: agendamento.profissionalId,
        unidadeId: agendamento.unidadeId,
        periodo: agendamento.periodo,
      }),
    );
    if (impactados.length > 0) {
      return Result.fail(
        new ConflitoAgendaError({
          detalhe: `existem ${impactados.length} atendimento(s) marcado(s) no período. Cancele ou reagende antes de bloquear`,
        }),
      );
    }

    await this.bloqueioRepository.salvar(bloqueio);
    return Result.ok(this.mapper.map({ bloqueio }));
  }
}
