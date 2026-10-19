import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { HorarioAtendimento } from '../../../domain/entities/horario-atendimento.entity';
import { ProfissionalNotFoundError } from '../../../domain/errors/profissional.errors';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { HorarioMapper } from '../../mappers/profissional.mapper';
import type { DefinirHorariosInputDto, DefinirHorariosOutputDto } from '../../dtos/profissional.dto';

export type DefinirHorariosDependencies = {
  profissionalRepository: IProfissionalRepository;
};

/**
 * Substitui a grade de horários do profissional em uma unidade.
 * Valida cada horário pela entidade de domínio e detecta sobreposição interna.
 */
export class DefinirHorariosUseCase extends UseCase<DefinirHorariosInputDto, DefinirHorariosOutputDto> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper = new HorarioMapper();

  constructor(dependencies: DefinirHorariosDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
  }

  async execute(input: DefinirHorariosInputDto): Promise<Result<DefinirHorariosOutputDto>> {
    const profissional = await this.profissionalRepository.findById(input.profissionalId);
    if (!profissional) {
      return Result.fail(new ProfissionalNotFoundError({ profissionalId: input.profissionalId }));
    }

    const horarios: HorarioAtendimento[] = [];

    for (const item of input.horarios) {
      const horarioResult = HorarioAtendimento.create({
        redeId: input.redeId,
        profissionalId: input.profissionalId,
        unidadeId: input.unidadeId,
        diaSemana: item.diaSemana,
        horaInicio: item.horaInicio,
        horaFim: item.horaFim,
        duracaoSlotMinutos: item.duracaoSlotMinutos,
        intervaloMinutos: item.intervaloMinutos,
      });
      if (horarioResult.isFailure) return Result.fail(horarioResult.error);
      horarios.push(horarioResult.value);
    }

    const sobreposicao = this.encontrarSobreposicao(horarios);
    if (sobreposicao) {
      return Result.fail(
        new Error(
          `Horários sobrepostos no mesmo dia da semana: ${sobreposicao.inicio} às ${sobreposicao.fim}`,
        ),
      );
    }

    await this.profissionalRepository.removerHorarios({
      profissionalId: input.profissionalId,
      unidadeId: input.unidadeId,
    });

    if (horarios.length > 0) {
      await this.profissionalRepository.salvarHorarios({
        redeId: input.redeId,
        profissionalId: input.profissionalId,
        unidadeId: input.unidadeId,
        horarios: horarios.map((horario) => ({
          redeId: input.redeId,
          profissionalId: input.profissionalId,
          unidadeId: input.unidadeId,
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFim: horario.horaFim,
          duracaoSlotMinutos: horario.duracaoSlotMinutos,
          intervaloMinutos: horario.intervaloMinutos,
        })),
      });
    }

    await this.profissionalRepository.definirUnidades({
      redeId: input.redeId,
      profissionalId: input.profissionalId,
      unidadeIds: [...new Set([...(await this.profissionalRepository.listarUnidades({ profissionalId: input.profissionalId })), input.unidadeId])],
    });

    return Result.ok({ horarios: horarios.map((horario) => this.mapper.map({ horario })) });
  }

  private encontrarSobreposicao(
    horarios: HorarioAtendimento[],
  ): { inicio: string; fim: string } | null {
    const porDia = new Map<number, HorarioAtendimento[]>();

    for (const horario of horarios) {
      const lista = porDia.get(horario.diaSemana) ?? [];
      const conflito = lista.find(
        (existente) => horario.horaInicio < existente.horaFim && horario.horaFim > existente.horaInicio,
      );
      if (conflito) {
        return { inicio: horario.horaInicio, fim: horario.horaFim };
      }
      lista.push(horario);
      porDia.set(horario.diaSemana, lista);
    }

    return null;
  }
}
