import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Agendamento } from '../../../domain/entities/agendamento.entity';
import { TipoAtendimentoNaoEncontradoError } from '../../../domain/errors/tipo-atendimento-nao-encontrado.error';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import { VerificadorConflitoService } from '../../../domain/services/verificador-conflito.service';
import { AgendamentoMapper } from '../../mappers/agendamento.mapper';
import type { AgendamentoOutputDto } from '../../mappers/agendamento.output.dto';
import type { CriarAgendamentoInputDto } from './criar-agendamento.input.dto';

export type CriarAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  bloqueioRepository: IBloqueioAgendaRepository;
  verificadorConflito: VerificadorConflitoService;
  mapper: AgendamentoMapper;
};

export type CriarAgendamentoOutputDto = {
  agendamento: AgendamentoOutputDto;
  avisos: string[];
};

export class CriarAgendamentoUseCase extends UseCase<
  CriarAgendamentoInputDto,
  CriarAgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly bloqueioRepository: IBloqueioAgendaRepository;
  private readonly verificadorConflito: VerificadorConflitoService;
  private readonly mapper: AgendamentoMapper;

  constructor(dependencies: CriarAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.bloqueioRepository = dependencies.bloqueioRepository;
    this.verificadorConflito = dependencies.verificadorConflito;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarAgendamentoInputDto): Promise<Result<CriarAgendamentoOutputDto>> {
    const tipo = await this.tipoAtendimentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.tipoAtendimentoId,
    });
    if (!tipo) {
      return Result.fail(
        new TipoAtendimentoNaoEncontradoError({ tipoId: input.tipoAtendimentoId }),
      );
    }
    if (!tipo.ativo) {
      return Result.fail(new Error('Tipo de atendimento inativo'));
    }

    const agendamentoResult = Agendamento.create({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      profissionalId: input.profissionalId,
      pacienteId: input.pacienteId,
      tipoAtendimentoId: input.tipoAtendimentoId,
      inicio: input.inicio,
      duracaoMinutos: input.duracaoMinutos ?? tipo.duracaoMinutos,
      encaixe: input.encaixe,
      observacoes: input.observacoes,
      origem: input.origem,
      criadoPor: input.criadoPor,
    });
    if (agendamentoResult.isFailure) return Result.propagate(agendamentoResult);

    const agendamento = agendamentoResult.value;
    const periodo = agendamento.periodo;

    const [existentes, bloqueios] = await Promise.all([
      this.agendamentoRepository.listar({
        redeId: input.redeId,
        unidadeId: input.unidadeId,
        profissionalId: input.profissionalId,
        inicio: periodo.inicio.toISOString(),
        fim: periodo.fim.toISOString(),
      }),
      this.bloqueioRepository.listar({
        redeId: input.redeId,
        unidadeId: input.unidadeId,
        profissionalId: input.profissionalId,
        inicio: periodo.inicio.toISOString(),
        fim: periodo.fim.toISOString(),
      }),
    ]);

    const conflitoResult = this.verificadorConflito.execute({
      profissionalId: input.profissionalId,
      unidadeId: input.unidadeId,
      periodo,
      encaixe: agendamento.encaixe,
      agendamentosExistentes: existentes,
      bloqueios,
    });
    if (conflitoResult.isFailure) return Result.propagate(conflitoResult);

    await this.agendamentoRepository.salvar(agendamento);

    return Result.ok({
      agendamento: this.mapper.map({ agendamento }),
      avisos: conflitoResult.value.avisos,
    });
  }
}
