import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { HorarioAtendimento } from '../../../domain/entities/horario-atendimento.entity';
import { ProfissionalNaoEncontradoError } from '../../../domain/errors/profissional-nao-encontrado.error';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { HorarioAtendimentoMapper } from '../../mappers/horario-atendimento.mapper';
import type { HorarioAtendimentoOutputDto } from '../../mappers/profissional.output.dto';
import type { DefinirHorariosInputDto } from './definir-horarios.input.dto';

export type DefinirHorariosDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: HorarioAtendimentoMapper;
};

export class DefinirHorariosUseCase extends UseCase<
  DefinirHorariosInputDto,
  HorarioAtendimentoOutputDto[]
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: HorarioAtendimentoMapper;

  constructor(dependencies: DefinirHorariosDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: DefinirHorariosInputDto): Promise<Result<HorarioAtendimentoOutputDto[]>> {
    const profissional = await this.profissionalRepository.buscarPorId({
      redeId: input.redeId,
      id: input.profissionalId,
    });
    if (!profissional) {
      return Result.fail(
        new ProfissionalNaoEncontradoError({ profissionalId: input.profissionalId }),
      );
    }

    const horarios: HorarioAtendimento[] = [];
    for (const item of input.horarios) {
      if (!profissional.atuaNaUnidade({ unidadeId: item.unidadeId })) {
        return Result.fail(
          new Error('Não é possível definir horário em unidade onde o profissional não atua'),
        );
      }
      const horarioResult = HorarioAtendimento.create({
        redeId: input.redeId,
        profissionalId: input.profissionalId,
        unidadeId: item.unidadeId,
        diaSemana: item.diaSemana,
        horaInicio: item.horaInicio,
        horaFim: item.horaFim,
      });
      if (horarioResult.isFailure) return Result.propagate(horarioResult);
      horarios.push(horarioResult.value);
    }

    await this.profissionalRepository.definirHorarios({
      redeId: input.redeId,
      profissionalId: input.profissionalId,
      horarios,
    });

    return Result.ok(horarios.map((horario) => this.mapper.map({ horario })));
  }
}
