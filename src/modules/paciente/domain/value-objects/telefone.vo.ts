import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type TelefoneValue = string;
export type TelefoneProps = { value: TelefoneValue };

export class Telefone extends ValueObject<TelefoneProps> {
  private constructor(props: TelefoneProps) {
    super(props);
  }

  get value(): TelefoneValue {
    return this.props.value;
  }

  get formatado(): string {
    const digits = this.props.value;
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return digits;
  }

  /** Formato E.164 usado pelas APIs de WhatsApp (Brasil). */
  get internacional(): string {
    return `55${this.props.value}`;
  }

  public static create(telefone: TelefoneValue): Result<Telefone> {
    const digits = (telefone ?? '').replace(/\D+/g, '').replace(/^55(?=\d{10,11}$)/, '');
    if (!digits) return Result.fail(new Error('Telefone é obrigatório'));
    if (digits.length < 10 || digits.length > 11) {
      return Result.fail(new Error('Telefone deve ter DDD + número (10 ou 11 dígitos)'));
    }
    return Result.ok(new Telefone({ value: digits }));
  }

  public static reconstitute(value: TelefoneValue): Telefone {
    return new Telefone({ value });
  }
}
