import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  AgendamentoDetalhado,
  IAgendaConsultaRepository,
} from '../../../domain/repositories/agenda-consulta-repository.interface';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import { BloqueioMapper } from '../../mappers/bloqueio.mapper';
import type { BloqueioOutputDto } from '../../mappers/bloqueio.output.dto';
import type { ListarAgendamentosInputDto } from './listar-agendamentos.input.dto';

export type ListarAgendamentosDependencies = {
  consultaRepository: IAgendaConsultaRepository;
  bloqueioRepository: IBloqueioAgendaRepository;
  bloqueioMapper: BloqueioMapper;
};

export type ListarAgendamentosOutputDto = {
  inicio: string;
  fim: string;
  agendamentos: AgendamentoDetalhado[];
  bloqueios: BloqueioOutputDto[];
};

export class ListarAgendamentosUseCase extends UseCase<
  ListarAgendamentosInputDto,
  ListarAgendamentosOutputDto
> {
  private readonly consultaRepository: IAgendaConsultaRepository;
  private readonly bloqueioRepository: IBloqueioAgendaRepository;
  private readonly bloqueioMapper: BloqueioMapper;

  constructor(dependencies: ListarAgendamentosDependencies) {
    super();
    this.consultaRepository = dependencies.consultaRepository;
    this.bloqueioRepository = dependencies.bloqueioRepository;
    this.bloqueioMapper = dependencies.bloqueioMapper;
  }

  async execute(input: ListarAgendamentosInputDto): Promise<Result<ListarAgendamentosOutputDto>> {
    if (new Date(input.fim).getTime() <= new Date(input.inicio).getTime()) {
      return Result.fail(new Error('Período de consulta inválido'));
    }

    const [agendamentos, bloqueios] = await Promise.all([
      this.consultaRepository.consultar({
        redeId: input.redeId,
        unidadeId: input.unidadeId ?? null,
        profissionalId: input.profissionalId ?? null,
        pacienteId: input.pacienteId ?? null,
        status: input.status ?? null,
        inicio: input.inicio,
        fim: input.fim,
      }),
      this.bloqueioRepository.listar({
        redeId: input.redeId,
        unidadeId: input.unidadeId ?? null,
        profissionalId: input.profissionalId ?? null,
        inicio: input.inicio,
        fim: input.fim,
      }),
    ]);

    return Result.ok({
      inicio: input.inicio,
      fim: input.fim,
      agendamentos,
      bloqueios: bloqueios.map((bloqueio) => this.bloqueioMapper.map({ bloqueio })),
    });
  }
}
