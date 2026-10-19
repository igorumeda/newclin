import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type NomeCompletoProps = { valor: string };

/** Nome do paciente: obrigatório, normalizado e pesquisável por trigramas. */
export class NomeCompleto extends ValueObject<NomeCompletoProps> {
  private constructor(props: NomeCompletoProps) {
    super(props);
  }

  get valor(): string {
    return this.props.valor;
  }

  /** Alias de compatibilidade com os use cases existentes. */
  get value(): string {
    return this.props.valor;
  }

  public primeiroNome(): string {
    return this.props.valor.split(' ')[0] ?? this.props.valor;
  }

  public iniciais(): string {
    const partes = this.props.valor.split(' ').filter(Boolean);
    return `${partes[0]?.[0] ?? ''}${partes[partes.length - 1]?.[0] ?? ''}`.toUpperCase();
  }

  public static create(valor: string): Result<NomeCompleto> {
    const nome = (valor ?? '').trim().replace(/\s+/g, ' ');

    if (nome.length < 3) return Result.fail(new Error('Nome deve ter ao menos 3 caracteres'));
    if (nome.length > 150) return Result.fail(new Error('Nome deve ter no máximo 150 caracteres'));
    if (!/^[\p{L}\s'.-]+$/u.test(nome)) {
      return Result.fail(new Error('Nome contém caracteres inválidos'));
    }

    return Result.ok(new NomeCompleto({ valor: nome }));
  }

  public static reconstitute(valor: string): NomeCompleto {
    return new NomeCompleto({ valor });
  }
}
