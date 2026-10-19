import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { JanelaHorario } from '../value-objects/janela-horario.vo';
import {
  statusFinal,
  transicaoPermitida,
} from '../value-objects/status-agendamento.vo';
import type { OrigemConfirmacao, StatusAgendamento } from '../value-objects/status-agendamento.vo';
import {
  EncaixeNaoPermitidoError,
  InvalidSchedulingOperationError,
  TransicaoStatusInvalidaError,
} from '../errors/agendamento.errors';

export type AgendamentoProps = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string | null;
  janela: JanelaHorario;
  status: StatusAgendamento;
  encaixe: boolean;
  encaixeJustificativa: string | null;
  observacoes: string | null;
  checkInEm: Date | null;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
  canceladoEm: Date | null;
  motivoCancelamento: string | null;
  confirmadoEm: Date | null;
  confirmadoPor: OrigemConfirmacao | null;
  criadoPor: string | null;
  ativo: boolean;
};

export type AgendamentoConstructorParams = EntityConstructorParams<AgendamentoProps>;

export type CreateAgendamentoParams = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId?: string | null;
  inicio: string | Date;
  fim: string | Date;
  encaixe?: boolean;
  encaixeJustificativa?: string | null;
  observacoes?: string | null;
  criadoPor?: string | null;
  statusInicial?: StatusAgendamento;
};

export type ReagendarParams = {
  inicio: string | Date;
  fim: string | Date;
  profissionalId?: string;
  unidadeId?: string;
  observacoes?: string | null;
};

export type CancelarParams = {
  motivo: string;
  canceladoPor?: string | null;
};

/**
 * Agendamento — raiz do contexto de agenda (§3.4).
 * O conflito de horários é verificado pelo caso de uso (via banco); o domínio
 * garante as transições de status e as regras de encaixe/cancelamento.
 */
export class Agendamento extends AggregateRoot<AgendamentoProps> {
  private constructor(params: AgendamentoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get unidadeId(): string {
    return this.props.unidadeId;
  }
  get profissionalId(): string {
    return this.props.profissionalId;
  }
  get pacienteId(): string {
    return this.props.pacienteId;
  }
  get tipoAtendimentoId(): string | null {
    return this.props.tipoAtendimentoId;
  }
  get janela(): JanelaHorario {
    return this.props.janela;
  }
  get status(): StatusAgendamento {
    return this.props.status;
  }
  get encaixe(): boolean {
    return this.props.encaixe;
  }
  get encaixeJustificativa(): string | null {
    return this.props.encaixeJustificativa;
  }
  get observacoes(): string | null {
    return this.props.observacoes;
  }
  get checkInEm(): Date | null {
    return this.props.checkInEm;
  }
  get iniciadoEm(): Date | null {
    return this.props.iniciadoEm;
  }
  get finalizadoEm(): Date | null {
    return this.props.finalizadoEm;
  }
  get canceladoEm(): Date | null {
    return this.props.canceladoEm;
  }
  get motivoCancelamento(): string | null {
    return this.props.motivoCancelamento;
  }
  get confirmadoEm(): Date | null {
    return this.props.confirmadoEm;
  }
  get confirmadoPor(): OrigemConfirmacao | null {
    return this.props.confirmadoPor;
  }
  get criadoPor(): string | null {
    return this.props.criadoPor;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public podeSerAlterado(): boolean {
    return !statusFinal(this.props.status);
  }

  public temCheckIn(): boolean {
    return this.props.checkInEm !== null;
  }

  /** Tempo de espera (min) desde o check-in — usado no painel da recepção. */
  public tempoDeEsperaMinutos(referencia: Date = new Date()): number | null {
    if (!this.props.checkInEm) return null;
    return Math.max(
      0,
      Math.round((referencia.getTime() - this.props.checkInEm.getTime()) / 60000),
    );
  }

  public static create(params: CreateAgendamentoParams): Result<Agendamento> {
    const janelaResult = JanelaHorario.create({ inicio: params.inicio, fim: params.fim });
    if (janelaResult.isFailure) return Result.fail(janelaResult.error);

    const encaixe = params.encaixe ?? false;
    const justificativa = params.encaixeJustificativa?.trim() || null;

    if (encaixe && !justificativa) {
      return Result.fail(
        new EncaixeNaoPermitidoError({
          reason: 'Encaixe exige justificativa para sobrepor um horário ocupado',
        }),
      );
    }

    return Result.ok(
      new Agendamento({
        props: {
          redeId: params.redeId,
          unidadeId: params.unidadeId,
          profissionalId: params.profissionalId,
          pacienteId: params.pacienteId,
          tipoAtendimentoId: params.tipoAtendimentoId ?? null,
          janela: janelaResult.value,
          status: params.statusInicial ?? 'agendado',
          encaixe,
          encaixeJustificativa: justificativa,
          observacoes: params.observacoes ?? null,
          checkInEm: null,
          iniciadoEm: null,
          finalizadoEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          confirmadoEm: null,
          confirmadoPor: null,
          criadoPor: params.criadoPor ?? null,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: AgendamentoConstructorParams): Agendamento {
    return new Agendamento(params);
  }

  public reagendar(params: ReagendarParams): Result<void> {
    if (!this.podeSerAlterado()) {
      return Result.fail(
        new InvalidSchedulingOperationError({
          reason: `Agendamento ${this.props.status} não pode mais ser reagendado`,
        }),
      );
    }

    const janelaResult = JanelaHorario.create({ inicio: params.inicio, fim: params.fim });
    if (janelaResult.isFailure) return Result.fail(janelaResult.error);

    this.props.janela = janelaResult.value;
    if (params.profissionalId !== undefined) this.props.profissionalId = params.profissionalId;
    if (params.unidadeId !== undefined) this.props.unidadeId = params.unidadeId;
    if (params.observacoes !== undefined) this.props.observacoes = params.observacoes;

    this.touch();
    return Result.ok();
  }

  public atualizarDados(params: {
    tipoAtendimentoId?: string | null;
    observacoes?: string | null;
    encaixe?: boolean;
    encaixeJustificativa?: string | null;
  }): Result<void> {
    if (params.encaixe !== undefined) {
      const justificativa = params.encaixeJustificativa?.trim() || this.props.encaixeJustificativa;
      if (params.encaixe && !justificativa) {
        return Result.fail(
          new EncaixeNaoPermitidoError({ reason: 'Encaixe exige justificativa' }),
        );
      }
      this.props.encaixe = params.encaixe;
      this.props.encaixeJustificativa = justificativa ?? null;
    }

    if (params.tipoAtendimentoId !== undefined) this.props.tipoAtendimentoId = params.tipoAtendimentoId;
    if (params.observacoes !== undefined) this.props.observacoes = params.observacoes;

    this.touch();
    return Result.ok();
  }

  public confirmar(params: { por: OrigemConfirmacao }): Result<void> {
    return this.transicionar({
      para: 'confirmado',
      mutacao: () => {
        this.props.confirmadoEm = new Date();
        this.props.confirmadoPor = params.por;
      },
    });
  }

  public registrarChegada(): Result<void> {
    if (this.props.checkInEm) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Check-in já registrado' }));
    }

    return this.transicionar({
      para: 'aguardando',
      mutacao: () => {
        this.props.checkInEm = new Date();
      },
    });
  }

  public iniciarAtendimento(): Result<void> {
    return this.transicionar({
      para: 'em_atendimento',
      mutacao: () => {
        this.props.iniciadoEm = new Date();
        if (!this.props.checkInEm) this.props.checkInEm = new Date();
      },
    });
  }

  public finalizar(): Result<void> {
    return this.transicionar({
      para: 'finalizado',
      mutacao: () => {
        this.props.finalizadoEm = new Date();
      },
    });
  }

  public registrarFalta(): Result<void> {
    return this.transicionar({ para: 'faltou' });
  }

  public cancelar(params: CancelarParams): Result<void> {
    const motivo = params.motivo?.trim();
    if (!motivo || motivo.length < 3) {
      return Result.fail(
        new InvalidSchedulingOperationError({ reason: 'Informe o motivo do cancelamento' }),
      );
    }

    return this.transicionar({
      para: 'cancelado',
      mutacao: () => {
        this.props.canceladoEm = new Date();
        this.props.motivoCancelamento = motivo;
      },
    });
  }

  private transicionar(params: { para: StatusAgendamento; mutacao?: () => void }): Result<void> {
    if (!transicaoPermitida(this.props.status, params.para)) {
      return Result.fail(
        new TransicaoStatusInvalidaError({ de: this.props.status, para: params.para }),
      );
    }

    if (this.props.status !== params.para) {
      this.props.status = params.para;
      params.mutacao?.();
      this.touch();
    }

    return Result.ok();
  }
}
