import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type NomePessoaValue = string;
export type NomePessoaProps = { value: NomePessoaValue };

export const NOME_TAMANHO_MINIMO = 3;
export const NOME_TAMANHO_MAXIMO = 120;

export class NomePessoa extends ValueObject<NomePessoaProps> {
  private constructor(props: NomePessoaProps) {
    super(props);
  }

  get value(): NomePessoaValue {
    return this.props.value;
  }

  get primeiroNome(): string {
    return this.props.value.split(' ')[0] ?? this.props.value;
  }

  public static create(nome: NomePessoaValue): Result<NomePessoa> {
    const normalized = (nome ?? '').trim().replace(/\s+/g, ' ');
    if (normalized.length < NOME_TAMANHO_MINIMO) {
      return Result.fail(new Error(`Nome deve ter no mínimo ${NOME_TAMANHO_MINIMO} caracteres`));
    }
    if (normalized.length > NOME_TAMANHO_MAXIMO) {
      return Result.fail(new Error('Nome muito longo'));
    }
    if (!/^[\p{L}\p{M}'.\- ]+$/u.test(normalized)) {
      return Result.fail(new Error('Nome contém caracteres inválidos'));
    }
    return Result.ok(new NomePessoa({ value: normalized }));
  }

  public static reconstitute(value: NomePessoaValue): NomePessoa {
    return new NomePessoa({ value });
  }
}
