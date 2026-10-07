import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  AgendamentoDetalhado,
  IAgendaConsultaRepository,
} from '../../../domain/repositories/agenda-consulta-repository.interface';
import type { StatusAgendamentoValue } from '../../../domain/value-objects/status-agendamento.vo';
import type { PainelRecepcaoInputDto } from './painel-recepcao.input.dto';

export type PainelRecepcaoDependencies = { consultaRepository: IAgendaConsultaRepository };

export type FilaRecepcao = {
  titulo: string;
  status: StatusAgendamentoValue;
  agendamentos: AgendamentoDetalhado[];
};

export type PainelRecepcaoOutputDto = {
  data: string;
  totais: Record<StatusAgendamentoValue, number>;
  filas: FilaRecepcao[];
};

const FILAS: Array<{ titulo: string; status: StatusAgendamentoValue }> = [
  { titulo: 'Agendados', status: 'agendado' },
  { titulo: 'Confirmados', status: 'confirmado' },
  { titulo: 'Aguardando', status: 'aguardando' },
  { titulo: 'Em atendimento', status: 'em_atendimento' },
  { titulo: 'Finalizados', status: 'finalizado' },
];

export class PainelRecepcaoUseCase extends UseCase<
  PainelRecepcaoInputDto,
  PainelRecepcaoOutputDto
> {
  private readonly consultaRepository: IAgendaConsultaRepository;

  constructor(dependencies: PainelRecepcaoDependencies) {
    super();
    this.consultaRepository = dependencies.consultaRepository;
  }

  async execute(input: PainelRecepcaoInputDto): Promise<Result<PainelRecepcaoOutputDto>> {
    const inicio = new Date(`${input.data.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(inicio.getTime())) {
      return Result.fail(new Error('Data inválida'));
    }
    const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

    const agendamentos = await this.consultaRepository.consultar({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
    });

    const totais: Record<StatusAgendamentoValue, number> = {
      agendado: 0,
      confirmado: 0,
      aguardando: 0,
      em_atendimento: 0,
      finalizado: 0,
      cancelado: 0,
      faltou: 0,
    };
    agendamentos.forEach((item) => {
      totais[item.status] += 1;
    });

    const filas = FILAS.map((fila) => ({
      titulo: fila.titulo,
      status: fila.status,
      agendamentos: agendamentos
        .filter((item) => item.status === fila.status)
        .sort((a, b) => {
          if (fila.status === 'aguardando') {
            return (a.ordemChegada ?? 0) - (b.ordemChegada ?? 0);
          }
          return a.inicio.localeCompare(b.inicio);
        }),
    }));

    return Result.ok({ data: inicio.toISOString().slice(0, 10), totais, filas });
  }
}
