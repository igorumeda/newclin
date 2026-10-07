import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Periodo } from '../value-objects/periodo.vo';
import { StatusAgendamento } from '../value-objects/status-agendamento.vo';
import type { StatusAgendamentoValue } from '../value-objects/status-agendamento.vo';
import { TransicaoStatusInvalidaError } from '../errors/transicao-status-invalida.error';
import { AgendamentoCriadoEvent } from '../events/agendamento-criado.event';
import { AgendamentoStatusAlteradoEvent } from '../events/agendamento-status-alterado.event';

export const ORIGENS_AGENDAMENTO = ['recepcao', 'importacao', 'whatsapp', 'sistema'] as const;
export type OrigemAgendamento = (typeof ORIGENS_AGENDAMENTO)[number];

export type AgendamentoProps = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string;
  periodo: Periodo;
  status: StatusAgendamento;
  encaixe: boolean;
  observacoes: string | null;
  motivoCancelamento: string | null;
  checkinEm: Date | null;
  ordemChegada: number | null;
  origem: OrigemAgendamento;
  criadoPor: string | null;
};

export type AgendamentoConstructorParams = EntityConstructorParams<AgendamentoProps>;
export type ReconstituirAgendamentoParams = AgendamentoConstructorParams & {
  id: NonNullable<AgendamentoConstructorParams['id']>;
};
export type CriarAgendamentoParams = {
  redeId: string;
  unidadeId: string;
  profissionalId: string;
  pacienteId: string;
  tipoAtendimentoId: string;
  inicio: string | Date;
  duracaoMinutos: number;
  encaixe?: boolean;
  observacoes?: string | null;
  origem?: OrigemAgendamento;
  criadoPor?: string | null;
};
export type AlterarStatusParams = { destino: string; motivo?: string | null };
export type RegistrarCheckinParams = { ordemChegada: number };
export type ReagendarParams = { inicio: string | Date; duracaoMinutos: number };

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

  get tipoAtendimentoId(): string {
    return this.props.tipoAtendimentoId;
  }

  get periodo(): Periodo {
    return this.props.periodo;
  }

  get status(): StatusAgendamento {
    return this.props.status;
  }

  get encaixe(): boolean {
    return this.props.encaixe;
  }

  get observacoes(): string | null {
    return this.props.observacoes;
  }

  get motivoCancelamento(): string | null {
    return this.props.motivoCancelamento;
  }

  get checkinEm(): Date | null {
    return this.props.checkinEm;
  }

  get ordemChegada(): number | null {
    return this.props.ordemChegada;
  }

  get origem(): OrigemAgendamento {
    return this.props.origem;
  }

  get criadoPor(): string | null {
    return this.props.criadoPor;
  }

  public static create(params: CriarAgendamentoParams): Result<Agendamento> {
    const periodoResult = Periodo.createPorDuracao({
      inicio: params.inicio,
      duracaoMinutos: params.duracaoMinutos,
    });
    if (periodoResult.isFailure) return Result.propagate(periodoResult);

    const agendamento = new Agendamento({
      props: {
        redeId: params.redeId,
        unidadeId: params.unidadeId,
        profissionalId: params.profissionalId,
        pacienteId: params.pacienteId,
        tipoAtendimentoId: params.tipoAtendimentoId,
        periodo: periodoResult.value,
        status: StatusAgendamento.inicial(),
        encaixe: params.encaixe ?? false,
        observacoes: params.observacoes?.trim() || null,
        motivoCancelamento: null,
        checkinEm: null,
        ordemChegada: null,
        origem: params.origem ?? 'recepcao',
        criadoPor: params.criadoPor ?? null,
      },
    });

    agendamento.addDomainEvent(
      new AgendamentoCriadoEvent({
        redeId: params.redeId,
        agendamentoId: agendamento.id.toString(),
        pacienteId: params.pacienteId,
      }),
    );

    return Result.ok(agendamento);
  }

  public static reconstitute(params: ReconstituirAgendamentoParams): Agendamento {
    return new Agendamento(params);
  }

  public alterarStatus({ destino, motivo }: AlterarStatusParams): Result<void> {
    const statusResult = StatusAgendamento.create(destino);
    if (statusResult.isFailure) return Result.propagate(statusResult);

    const novoStatus = statusResult.value;
    if (!this.props.status.podeTransitarPara({ destino: novoStatus.value })) {
      return Result.fail(
        new TransicaoStatusInvalidaError({
          origem: this.props.status.value,
          destino: novoStatus.value,
        }),
      );
    }

    if (novoStatus.value === 'cancelado' && !motivo?.trim()) {
      return Result.fail(new Error('Informe o motivo do cancelamento'));
    }

    const anterior = this.props.status.value;
    this.props.status = novoStatus;
    if (novoStatus.value === 'cancelado') {
      this.props.motivoCancelamento = motivo?.trim() ?? null;
    }
    this.touch();

    this.addDomainEvent(
      new AgendamentoStatusAlteradoEvent({
        redeId: this.props.redeId,
        agendamentoId: this.id.toString(),
        statusAnterior: anterior,
        statusAtual: novoStatus.value as StatusAgendamentoValue,
      }),
    );

    return Result.ok();
  }

  public registrarCheckin({ ordemChegada }: RegistrarCheckinParams): Result<void> {
    if (!this.props.status.podeTransitarPara({ destino: 'aguardando' })) {
      return Result.fail(
        new TransicaoStatusInvalidaError({
          origem: this.props.status.value,
          destino: 'aguardando',
        }),
      );
    }
    this.props.status = StatusAgendamento.reconstitute('aguardando');
    this.props.checkinEm = new Date();
    this.props.ordemChegada = ordemChegada;
    this.touch();
    return Result.ok();
  }

  public reagendar(params: ReagendarParams): Result<void> {
    if (this.props.status.isFinal) {
      return Result.fail(new Error('Agendamentos finalizados ou cancelados não podem ser movidos'));
    }
    const periodoResult = Periodo.createPorDuracao({
      inicio: params.inicio,
      duracaoMinutos: params.duracaoMinutos,
    });
    if (periodoResult.isFailure) return Result.propagate(periodoResult);
    this.props.periodo = periodoResult.value;
    this.touch();
    return Result.ok();
  }

  public marcarComoEncaixe(): void {
    this.props.encaixe = true;
    this.touch();
  }

  public tempoEsperaMinutos(referencia: Date = new Date()): number | null {
    if (!this.props.checkinEm) return null;
    return Math.max(
      0,
      Math.round((referencia.getTime() - this.props.checkinEm.getTime()) / 60_000),
    );
  }
}
