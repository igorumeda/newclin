import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { SlotAgendaService } from '../../../domain/services/slot-agenda.service';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IProfissionalLookup } from '@/modules/professional/domain/services/profissional-lookup.interface';
import type {
  ListarHorariosDisponiveisInputDto,
  ListarHorariosDisponiveisOutputDto,
} from '../../dtos/agenda.dto';

export type HorariosDisponiveisDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  bloqueioRepository: IBloqueioAgendaRepository;
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  unidadeLookup: IUnidadeLookup;
  profissionalLookup: IProfissionalLookup;
  slotService: SlotAgendaService;
};

/**
 * Malha de horários livres do profissional em uma data (§3.4), considerando a
 * grade de atendimento, os bloqueios e os agendamentos já existentes.
 */
export class ListarHorariosDisponiveisUseCase extends UseCase<
  ListarHorariosDisponiveisInputDto,
  ListarHorariosDisponiveisOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly bloqueioRepository: IBloqueioAgendaRepository;
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly profissionalLookup: IProfissionalLookup;
  private readonly slotService: SlotAgendaService;

  constructor(dependencies: HorariosDisponiveisDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.bloqueioRepository = dependencies.bloqueioRepository;
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.unidadeLookup = dependencies.unidadeLookup;
    this.profissionalLookup = dependencies.profissionalLookup;
    this.slotService = dependencies.slotService;
  }

  async execute(
    input: ListarHorariosDisponiveisInputDto,
  ): Promise<Result<ListarHorariosDisponiveisOutputDto>> {
    const unidade = await this.unidadeLookup.findById(input.unidadeId);
    const timezone = unidade?.timezone ?? 'America/Sao_Paulo';

    const inicioDia = fromZonedTime(`${input.data}T00:00:00`, timezone);
    const fimDia = fromZonedTime(`${input.data}T23:59:59.999`, timezone);
    const diaSemana = Number(formatInTimeZone(inicioDia, timezone, 'i')) % 7;

    const duracaoMinutos = input.tipoAtendimentoId
      ? (await this.tipoAtendimentoRepository.findById(input.tipoAtendimentoId))?.duracaoMinutos ?? 30
      : 30;

    const [horarios, agendamentos, bloqueios] = await Promise.all([
      this.profissionalLookup.listarHorarios({
        profissionalId: input.profissionalId,
        unidadeId: input.unidadeId,
      }),
      this.agendamentoRepository.listar({
        redeId: input.redeId,
        unidadeId: input.unidadeId,
        profissionalId: input.profissionalId,
        de: inicioDia.toISOString(),
        ate: fimDia.toISOString(),
        page: 1,
        perPage: 500,
      }),
      this.bloqueioRepository.listar({
        redeId: input.redeId,
        unidadeId: input.unidadeId,
        profissionalId: input.profissionalId,
        de: inicioDia.toISOString(),
        ate: fimDia.toISOString(),
        somenteAtivos: true,
      }),
    ]);

    const faixas = horarios
      .filter((horario) => horario.diaSemana === diaSemana)
      .map((horario) => ({
        inicio: fromZonedTime(`${input.data}T${horario.horaInicio}:00`, timezone),
        fim: fromZonedTime(`${input.data}T${horario.horaFim}:00`, timezone),
        duracaoSlotMinutos: horario.duracaoSlotMinutos,
        intervaloMinutos: horario.intervaloMinutos,
      }));

    const slotsResult = this.slotService.gerar({
      faixasAtendimento: faixas,
      ocupados: agendamentos.items.map((agendamento) => ({
        inicio: agendamento.janela.inicio,
        fim: agendamento.janela.fim,
        encaixe: agendamento.encaixe,
      })),
      bloqueios: bloqueios.map((bloqueio) => ({
        inicio: bloqueio.janela.inicio,
        fim: bloqueio.janela.fim,
      })),
      duracaoMinutos,
      referencia: new Date(),
      incluirPassados: input.incluirPassados ?? false,
    });

    if (slotsResult.isFailure) return Result.fail(slotsResult.error);

    return Result.ok({
      data: input.data,
      timezone,
      duracaoMinutos,
      slots: slotsResult.value,
    });
  }
}
