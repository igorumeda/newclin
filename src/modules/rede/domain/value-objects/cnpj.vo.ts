import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type CnpjValue = string;
export type CnpjProps = { value: CnpjValue };

const PESOS_PRIMEIRO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export class Cnpj extends ValueObject<CnpjProps> {
  private constructor(props: CnpjProps) {
    super(props);
  }

  get value(): CnpjValue {
    return this.props.value;
  }

  get formatado(): string {
    const digits = this.props.value;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  private static calcularDigito(base: string, pesos: number[]): number {
    const soma = base
      .split('')
      .reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  public static create(cnpj: CnpjValue): Result<Cnpj> {
    const digits = (cnpj ?? '').replace(/\D+/g, '');
    if (digits.length !== 14) return Result.fail(new Error('CNPJ deve ter 14 dígitos'));
    if (/^(\d)\1{13}$/.test(digits)) return Result.fail(new Error('CNPJ inválido'));

    const primeiro = Cnpj.calcularDigito(digits.slice(0, 12), PESOS_PRIMEIRO);
    const segundo = Cnpj.calcularDigito(digits.slice(0, 13), PESOS_SEGUNDO);
    if (primeiro !== Number(digits[12]) || segundo !== Number(digits[13])) {
      return Result.fail(new Error('CNPJ inválido'));
    }
    return Result.ok(new Cnpj({ value: digits }));
  }

  public static reconstitute(value: CnpjValue): Cnpj {
    return new Cnpj({ value });
  }
}
