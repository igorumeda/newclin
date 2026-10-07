import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type SenhaValue = string;
export type SenhaProps = { value: SenhaValue };

export const SENHA_TAMANHO_MINIMO = 8;
export const SENHA_TAMANHO_MAXIMO = 72;

export class Senha extends ValueObject<SenhaProps> {
  private constructor(props: SenhaProps) {
    super(props);
  }

  get value(): SenhaValue {
    return this.props.value;
  }

  public static create(senha: SenhaValue): Result<Senha> {
    const value = senha ?? '';
    if (value.length < SENHA_TAMANHO_MINIMO) {
      return Result.fail(new Error(`Senha deve ter no mínimo ${SENHA_TAMANHO_MINIMO} caracteres`));
    }
    if (value.length > SENHA_TAMANHO_MAXIMO) {
      return Result.fail(new Error('Senha muito longa'));
    }
    if (!/[A-Za-zÀ-ÿ]/.test(value)) {
      return Result.fail(new Error('Senha deve conter ao menos uma letra'));
    }
    if (!/[0-9]/.test(value)) {
      return Result.fail(new Error('Senha deve conter ao menos um número'));
    }
    return Result.ok(new Senha({ value }));
  }
}
