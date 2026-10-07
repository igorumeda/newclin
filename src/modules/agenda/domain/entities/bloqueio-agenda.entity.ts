import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Periodo } from '../value-objects/periodo.vo';

export type BloqueioAgendaProps = {
  redeId: string;
  unidadeId: string;
  profissionalId: string | null;
  motivo: string;
  periodo: Periodo;
  criadoPor: string | null;
};

export type BloqueioAgendaConstructorParams = EntityConstructorParams<BloqueioAgendaProps>;
export type ReconstituirBloqueioParams = BloqueioAgendaConstructorParams & {
  id: NonNullable<BloqueioAgendaConstructorParams['id']>;
};
export type CriarBloqueioParams = {
  redeId: string;
  unidadeId: string;
  profissionalId?: string | null;
  motivo: string;
  inicio: string | Date;
  fim: string | Date;
  criadoPor?: string | null;
};
export type AfetaParams = { profissionalId: string; unidadeId: string; periodo: Periodo };

const DURACAO_MAXIMA_BLOQUEIO_MINUTOS = 60 * 24 * 90;

export class BloqueioAgenda extends Entity<BloqueioAgendaProps> {
  private constructor(params: BloqueioAgendaConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get unidadeId(): string {
    return this.props.unidadeId;
  }

  get profissionalId(): string | null {
    return this.props.profissionalId;
  }

  get motivo(): string {
    return this.props.motivo;
  }

  get periodo(): Periodo {
    return this.props.periodo;
  }

  get criadoPor(): string | null {
    return this.props.criadoPor;
  }

  public static create(params: CriarBloqueioParams): Result<BloqueioAgenda> {
    if (!params.motivo || params.motivo.trim().length < 3) {
      return Result.fail(new Error('Motivo do bloqueio deve ter no mínimo 3 caracteres'));
    }
    const inicio = params.inicio instanceof Date ? params.inicio : new Date(params.inicio);
    const fim = params.fim instanceof Date ? params.fim : new Date(params.fim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return Result.fail(new Error('Período do bloqueio inválido'));
    }
    if (fim.getTime() <= inicio.getTime()) {
      return Result.fail(new Error('O fim do bloqueio deve ser posterior ao início'));
    }
    const duracao = (fim.getTime() - inicio.getTime()) / 60_000;
    if (duracao > DURACAO_MAXIMA_BLOQUEIO_MINUTOS) {
      return Result.fail(new Error('Bloqueio não pode exceder 90 dias'));
    }

    return Result.ok(
      new BloqueioAgenda({
        props: {
          redeId: params.redeId,
          unidadeId: params.unidadeId,
          profissionalId: params.profissionalId ?? null,
          motivo: params.motivo.trim(),
          periodo: Periodo.reconstitute({ inicio, fim }),
          criadoPor: params.criadoPor ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirBloqueioParams): BloqueioAgenda {
    return new BloqueioAgenda(params);
  }

  /** Um bloqueio sem profissional vale para toda a unidade. */
  public afeta({ profissionalId, unidadeId, periodo }: AfetaParams): boolean {
    if (this.props.unidadeId !== unidadeId) return false;
    if (this.props.profissionalId && this.props.profissionalId !== profissionalId) return false;
    return this.props.periodo.sobrepoe({ periodo });
  }
}
