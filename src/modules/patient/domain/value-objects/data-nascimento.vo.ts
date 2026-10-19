import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type DataNascimentoProps = { valor: Date };

const IDADE_MAXIMA_ANOS = 130;

/** Data de nascimento em UTC; base do cálculo de idade e do menor de 18 anos. */
export class DataNascimento extends ValueObject<DataNascimentoProps> {
  private constructor(props: DataNascimentoProps) {
    super(props);
  }

  get valor(): Date {
    return this.props.valor;
  }

  /** Alias de compatibilidade com os use cases existentes. */
  get value(): Date {
    return this.props.valor;
  }

  public paraISO(): string {
    return this.props.valor.toISOString().slice(0, 10);
  }

  public idade(referencia: Date = new Date()): number {
    const nascimento = this.props.valor;
    let idade = referencia.getUTCFullYear() - nascimento.getUTCFullYear();
    const mes = referencia.getUTCMonth() - nascimento.getUTCMonth();

    if (mes < 0 || (mes === 0 && referencia.getUTCDate() < nascimento.getUTCDate())) idade -= 1;

    return Math.max(0, idade);
  }

  public isMenorDeIdade(referencia: Date = new Date()): boolean {
    return this.idade(referencia) < 18;
  }

  public static create(valor: string | Date): Result<DataNascimento> {
    const data = valor instanceof Date ? valor : new Date(`${valor}T00:00:00.000Z`);

    if (Number.isNaN(data.getTime())) return Result.fail(new Error('Data de nascimento inválida'));
    if (data.getTime() > Date.now()) {
      return Result.fail(new Error('Data de nascimento não pode ser futura'));
    }

    const nascimento = new DataNascimento({ valor: data });
    if (nascimento.idade() > IDADE_MAXIMA_ANOS) {
      return Result.fail(new Error('Data de nascimento inválida'));
    }

    return Result.ok(nascimento);
  }

  public static reconstitute(valor: string | Date): DataNascimento {
    const data = valor instanceof Date ? valor : new Date(`${valor}T00:00:00.000Z`);
    return new DataNascimento({ valor: data });
  }
}
