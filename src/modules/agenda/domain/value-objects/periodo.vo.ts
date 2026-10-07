import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type PeriodoProps = { inicio: Date; fim: Date };
export type CriarPeriodoParams = { inicio: Date | string; fim: Date | string };
export type CriarPeriodoPorDuracaoParams = { inicio: Date | string; duracaoMinutos: number };
export type SobrepoeParams = { periodo: Periodo };
export type ContemParams = { instante: Date };

export const DURACAO_MINIMA_MINUTOS = 5;
export const DURACAO_MAXIMA_MINUTOS = 480;

export class Periodo extends ValueObject<PeriodoProps> {
  private constructor(props: PeriodoProps) {
    super(props);
  }

  get inicio(): Date {
    return this.props.inicio;
  }

  get fim(): Date {
    return this.props.fim;
  }

  get duracaoMinutos(): number {
    return Math.round((this.props.fim.getTime() - this.props.inicio.getTime()) / 60_000);
  }

  /** Sobreposição de intervalos semiabertos [inicio, fim). */
  public sobrepoe({ periodo }: SobrepoeParams): boolean {
    return (
      this.props.inicio.getTime() < periodo.fim.getTime() &&
      periodo.inicio.getTime() < this.props.fim.getTime()
    );
  }

  public contem({ instante }: ContemParams): boolean {
    return (
      instante.getTime() >= this.props.inicio.getTime() &&
      instante.getTime() < this.props.fim.getTime()
    );
  }

  public static create(params: CriarPeriodoParams): Result<Periodo> {
    const inicio = params.inicio instanceof Date ? params.inicio : new Date(params.inicio);
    const fim = params.fim instanceof Date ? params.fim : new Date(params.fim);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return Result.fail(new Error('Data ou hora inválida'));
    }
    if (fim.getTime() <= inicio.getTime()) {
      return Result.fail(new Error('O horário final deve ser maior que o inicial'));
    }
    const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60_000);
    if (duracao < DURACAO_MINIMA_MINUTOS) {
      return Result.fail(new Error(`Duração mínima de ${DURACAO_MINIMA_MINUTOS} minutos`));
    }
    if (duracao > DURACAO_MAXIMA_MINUTOS) {
      return Result.fail(new Error(`Duração máxima de ${DURACAO_MAXIMA_MINUTOS} minutos`));
    }
    return Result.ok(new Periodo({ inicio, fim }));
  }

  public static createPorDuracao(params: CriarPeriodoPorDuracaoParams): Result<Periodo> {
    const inicio = params.inicio instanceof Date ? params.inicio : new Date(params.inicio);
    if (Number.isNaN(inicio.getTime())) {
      return Result.fail(new Error('Data ou hora inválida'));
    }
    return Periodo.create({
      inicio,
      fim: new Date(inicio.getTime() + params.duracaoMinutos * 60_000),
    });
  }

  public static reconstitute(props: PeriodoProps): Periodo {
    return new Periodo(props);
  }
}
