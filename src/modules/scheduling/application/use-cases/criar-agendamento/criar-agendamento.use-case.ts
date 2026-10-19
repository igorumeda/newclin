import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Agendamento } from '../../../domain/entities/agendamento.entity';
import { BloqueioAgendaError, ConflitoAgendaError } from '../../../domain/errors/agendamento.errors';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import type { IAgendaNotificacaoPort } from '../../../domain/services/agenda-notificacao.interface';
import type { IPacienteLookup } from '@/modules/patient/domain/services/paciente-lookup.interface';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IRedeLookup } from '@/modules/organization/domain/services/rede-lookup.interface';
import { AgendamentoMapper } from '../../mappers/agenda.mapper';
import type { AgendaEnricher } from '../../services/agenda-enricher.service';
import { montarDadosNotificacao } from '../../services/agendamento-notificacao.factory';
import type { CriarAgendamentoInputDto, CriarAgendamentoOutputDto } from '../../dtos/agenda.dto';

export type CriarAgendamentoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  enricher: AgendaEnricher;
  mapper: AgendamentoMapper;
  pacienteLookup: IPacienteLookup;
  unidadeLookup: IUnidadeLookup;
  redeLookup: IRedeLookup;
  notificacao: IAgendaNotificacaoPort | null;
};

/**
 * Cria o agendamento aplicando as regras do §3.4:
 *   - paciente ativo e da mesma rede;
 *   - duração vinda do tipo de atendimento quando não informada;
 *   - conflito de horário bloqueado, exceto encaixe justificado;
 *   - bloqueio de agenda sempre bloqueia;
 *   - confirmação enfileirada quando o tipo exige confirmação (§4.1/§4.2).
 */
export class CriarAgendamentoUseCase extends UseCase<
  CriarAgendamentoInputDto,
  CriarAgendamentoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly enricher: AgendaEnricher;
  private readonly mapper: AgendamentoMapper;
  private readonly pacienteLookup: IPacienteLookup;
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly redeLookup: IRedeLookup;
  private readonly notificacao: IAgendaNotificacaoPort | null;

  constructor(dependencies: CriarAgendamentoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.enricher = dependencies.enricher;
    this.mapper = dependencies.mapper;
    this.pacienteLookup = dependencies.pacienteLookup;
    this.unidadeLookup = dependencies.unidadeLookup;
    this.redeLookup = dependencies.redeLookup;
    this.notificacao = dependencies.notificacao;
  }

  async execute(input: CriarAgendamentoInputDto): Promise<Result<CriarAgendamentoOutputDto>> {
    const paciente = await this.pacienteLookup.findById(input.pacienteId);
    if (!paciente) {
      return Result.fail(new Error('Paciente não encontrado nesta rede'));
    }
    if (!paciente.ativo) {
      return Result.fail(new Error('Paciente inativo não pode ser agendado'));
    }

    const duracaoMinutos = await this.resolverDuracao(input);
    const fim = input.fim
      ? new Date(input.fim)
      : new Date(new Date(input.inicio).getTime() + duracaoMinutos * 60000);

    const agendamentoResult = Agendamento.create({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      profissionalId: input.profissionalId,
      pacienteId: input.pacienteId,
      tipoAtendimentoId: input.tipoAtendimentoId ?? null,
      inicio: input.inicio,
      fim,
      encaixe: input.encaixe,
      encaixeJustificativa: input.encaixeJustificativa,
      observacoes: input.observacoes,
      criadoPor: input.criadoPor,
    });
    if (agendamentoResult.isFailure) return Result.fail(agendamentoResult.error);

    const agendamento = agendamentoResult.value;

    const conflito = await this.validarDisponibilidade({
      agendamento,
      encaixe: input.encaixe ?? false,
    });
    if (conflito.isFailure) return Result.fail(conflito.error);

    await this.agendamentoRepository.save(agendamento);

    const enriquecimento = await this.enricher.enriquecerUm({
      agendamento,
      redeId: input.redeId,
    });

    if (input.notificarPaciente !== false) {
      await this.enfileirarConfirmacao({ agendamento, enriquecimento, createdBy: input.criadoPor });
    }

    return Result.ok(this.mapper.map({ agendamento, enriquecimento }));
  }

  /** Conflito e bloqueio são verificados no banco (funções SQL do módulo). */
  private async validarDisponibilidade(params: {
    agendamento: Agendamento;
    encaixe: boolean;
  }): Promise<Result<void>> {
    const { agendamento, encaixe } = params;
    const { inicio, fim } = agendamento.janela.toISO();

    const bloqueios = await this.agendamentoRepository.verificarBloqueio({
      profissionalId: agendamento.profissionalId,
      unidadeId: agendamento.unidadeId,
      inicio,
      fim,
    });
    if (bloqueios.length > 0) return Result.fail(new BloqueioAgendaError({ detalhes: bloqueios }));

    const conflitos = await this.agendamentoRepository.verificarConflito({
      profissionalId: agendamento.profissionalId,
      unidadeId: agendamento.unidadeId,
      inicio,
      fim,
    });
    if (conflitos.length > 0 && !encaixe) {
      return Result.fail(new ConflitoAgendaError({ detalhes: conflitos }));
    }

    return Result.ok();
  }

  private async enfileirarConfirmacao(params: {
    agendamento: Agendamento;
    enriquecimento: Awaited<ReturnType<AgendaEnricher['enriquecerUm']>>;
    createdBy?: string | null;
  }): Promise<void> {
    if (!this.notificacao) return;

    const { agendamento, enriquecimento, createdBy } = params;
    const exigeConfirmacao = agendamento.tipoAtendimentoId
      ? (
          await this.tipoAtendimentoRepository.findById(agendamento.tipoAtendimentoId)
        )?.requerConfirmacao ?? true
      : true;

    if (!exigeConfirmacao) return;

    const [unidade, rede] = await Promise.all([
      this.unidadeLookup.findById(agendamento.unidadeId),
      this.redeLookup.findById(agendamento.redeId),
    ]);

    await this.notificacao.confirmacaoAgendamento(
      montarDadosNotificacao({
        agendamento,
        enriquecimento,
        unidade,
        redeNome: rede?.nome ?? 'Clínica',
        createdBy,
      }),
    );
  }

  private async resolverDuracao(input: CriarAgendamentoInputDto): Promise<number> {
    if (input.tipoAtendimentoId) {
      const tipo = await this.tipoAtendimentoRepository.findById(input.tipoAtendimentoId);
      if (tipo) return input.duracaoMinutos ?? tipo.duracaoMinutos;
    }

    if (input.duracaoMinutos) return input.duracaoMinutos;
    if (input.fim) {
      return Math.max(5, Math.round((new Date(input.fim).getTime() - new Date(input.inicio).getTime()) / 60000));
    }

    return 30;
  }
}
