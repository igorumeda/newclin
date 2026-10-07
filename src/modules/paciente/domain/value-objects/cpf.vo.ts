import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type CpfValue = string;
export type CpfProps = { value: CpfValue };

export class Cpf extends ValueObject<CpfProps> {
  private constructor(props: CpfProps) {
    super(props);
  }

  get value(): CpfValue {
    return this.props.value;
  }

  get formatado(): string {
    const digits = this.props.value;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  private static calcularDigito(base: string, pesoInicial: number): number {
    const soma = base
      .split('')
      .reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  private static isValid(digits: CpfValue): boolean {
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    const primeiro = Cpf.calcularDigito(digits.slice(0, 9), 10);
    const segundo = Cpf.calcularDigito(digits.slice(0, 10), 11);
    return primeiro === Number(digits[9]) && segundo === Number(digits[10]);
  }

  public static create(cpf: CpfValue): Result<Cpf> {
    const digits = (cpf ?? '').replace(/\D+/g, '');
    if (!digits) return Result.fail(new Error('CPF é obrigatório'));
    if (digits.length !== 11) return Result.fail(new Error('CPF deve ter 11 dígitos'));
    if (!Cpf.isValid(digits)) return Result.fail(new Error('CPF inválido'));
    return Result.ok(new Cpf({ value: digits }));
  }

  public static reconstitute(value: CpfValue): Cpf {
    return new Cpf({ value });
  }
}
