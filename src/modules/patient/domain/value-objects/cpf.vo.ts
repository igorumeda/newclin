import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type CpfProps = { valor: string };

/** CPF validado pelos dígitos verificadores e persistido apenas com números. */
export class Cpf extends ValueObject<CpfProps> {
  private constructor(props: CpfProps) {
    super(props);
  }

  get valor(): string {
    return this.props.valor;
  }

  /** Alias de compatibilidade com os use cases existentes. */
  get value(): string {
    return this.props.valor;
  }

  public formatado(): string {
    return this.props.valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  private static calcularDigito(base: string, pesoInicial: number): number {
    const soma = base
      .split('')
      .reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  public static create(valor: string): Result<Cpf> {
    const numeros = (valor ?? '').replace(/\D/g, '');

    if (numeros.length !== 11) return Result.fail(new Error('CPF deve conter 11 dígitos'));
    if (/^(\d)\1{10}$/.test(numeros)) return Result.fail(new Error('CPF inválido'));

    const primeiroDigito = Cpf.calcularDigito(numeros.slice(0, 9), 10);
    const segundoDigito = Cpf.calcularDigito(numeros.slice(0, 10), 11);

    if (Number(numeros[9]) !== primeiroDigito || Number(numeros[10]) !== segundoDigito) {
      return Result.fail(new Error('CPF inválido'));
    }

    return Result.ok(new Cpf({ valor: numeros }));
  }

  public static reconstitute(valor: string): Cpf {
    return new Cpf({ valor });
  }
}
