import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import {
  AgendamentoNotFoundError,
  BloqueioAgendaError,
  ConflitoAgendaError,
} from '../../../domain/errors/agendamento.errors';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import type {
  AtualizarAgendamentoInputDto,
  AtualizarAgendamentoOutputDto,
} from '../../dtos/agenda.dto';

export type AtualizarAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
};

/** Reagendamento e ajustes do agendamento, com reverificação de conflito. */
export class AtualizarAgendamentoUseCase extends UseCase<
  AtualizarAgendamentoInputDto,
  AtualizarAgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: AtualizarAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarAgendamentoInputDto): Promise<Result<AtualizarAgendamentoOutputDto>> {
    const agendamento = await this.agendamentoRepository.findById(input.agendamentoId);
    if (!agendamento) {
      return Result.fail(new AgendamentoNotFoundError({ agendamentoId: input.agendamentoId }));
    }

    const dadosAtualizados = agendamento.atualizarDados({
      tipoAtendimentoId: input.tipoAtendimentoId,
      observacoes: input.observacoes,
      encaixe: input.encaixe,
      encaixeJustificativa: input.encaixeJustificativa,
    });
    if (dadosAtualizados.isFailure) return Result.fail(dadosAtualizados.error);

    const horarioAlterado = input.inicio !== undefined || input.fim !== undefined;

    if (horarioAlterado) {
      const duracao =
        input.duracaoMinutos ??
        (input.tipoAtendimentoId
          ? (await this.tipoAtendimentoRepository.findById(input.tipoAtendimentoId))?.duracaoMinutos
          : undefined) ??
        agendamento.janela.duracaoMinutos();

      const inicio = input.inicio ? new Date(input.inicio) : agendamento.janela.inicio;
      const fim = input.fim ? new Date(input.fim) : new Date(inicio.getTime() + duracao * 60000);

      const reagendamento = agendamento.reagendar({
        inicio,
        fim,
        profissionalId: input.profissionalId,
        unidadeId: input.unidadeId,
        observacoes: input.observacoes,
      });
      if (reagendamento.isFailure) return Result.fail(reagendamento.error);

      const { inicio: inicioISO, fim: fimISO } = agendamento.janela.toISO();

      const bloqueios = await this.agendamentoRepository.verificarBloqueio({
        profissionalId: agendamento.profissionalId,
        unidadeId: agendamento.unidadeId,
        inicio: inicioISO,
        fim: fimISO,
      });
      if (bloqueios.length > 0) return Result.fail(new BloqueioAgendaError({ detalhes: bloqueios }));

      const conflitos = await this.agendamentoRepository.verificarConflito({
        profissionalId: agendamento.profissionalId,
        unidadeId: agendamento.unidadeId,
        inicio: inicioISO,
        fim: fimISO,
        ignorarAgendamentoId: input.agendamentoId,
      });
      if (conflitos.length > 0 && !agendamento.encaixe) {
        return Result.fail(new ConflitoAgendaError({ detalhes: conflitos }));
      }
    }

    await this.agendamentoRepository.update(agendamento);

    const enriquecimento = await this.enricher.enriquecerUm({
      agendamento,
      redeId: agendamento.redeId,
    });

    return Result.ok(this.mapper.map({ agendamento, enriquecimento }));
  }
}
