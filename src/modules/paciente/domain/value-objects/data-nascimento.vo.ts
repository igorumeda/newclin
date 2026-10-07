import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type DataNascimentoValue = string | Date;
export type DataNascimentoProps = { value: Date };
export type IdadeEmParams = { referencia?: Date };

export const IDADE_MAXIMA = 130;
export const MAIORIDADE = 18;

export class DataNascimento extends ValueObject<DataNascimentoProps> {
  private constructor(props: DataNascimentoProps) {
    super(props);
  }

  get value(): Date {
    return this.props.value;
  }

  get iso(): string {
    return this.props.value.toISOString().slice(0, 10);
  }

  public idadeEm({ referencia = new Date() }: IdadeEmParams = {}): number {
    const nascimento = this.props.value;
    let idade = referencia.getUTCFullYear() - nascimento.getUTCFullYear();
    const mes = referencia.getUTCMonth() - nascimento.getUTCMonth();
    if (mes < 0 || (mes === 0 && referencia.getUTCDate() < nascimento.getUTCDate())) {
      idade -= 1;
    }
    return idade;
  }

  public isMenorDeIdade(): boolean {
    return this.idadeEm() < MAIORIDADE;
  }

  private static parse(valor: DataNascimentoValue): Date | null {
    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }
    const texto = (valor ?? '').toString().trim();
    if (!texto) return null;

    const brasileiro = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (brasileiro) {
      const [, dia, mes, ano] = brasileiro;
      return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
    }
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const [, ano, mes, dia] = iso;
      return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
    }
    const fallback = new Date(texto);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  public static create(valor: DataNascimentoValue): Result<DataNascimento> {
    const data = DataNascimento.parse(valor);
    if (!data) return Result.fail(new Error('Data de nascimento inválida'));

    const hoje = new Date();
    if (data.getTime() > hoje.getTime()) {
      return Result.fail(new Error('Data de nascimento não pode estar no futuro'));
    }
    const idade = hoje.getUTCFullYear() - data.getUTCFullYear();
    if (idade > IDADE_MAXIMA) {
      return Result.fail(new Error('Data de nascimento muito antiga'));
    }
    return Result.ok(new DataNascimento({ value: data }));
  }

  public static reconstitute(value: Date): DataNascimento {
    return new DataNascimento({ value });
  }
}
