import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type EnderecoProps = {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

export type EnderecoValue = Partial<EnderecoProps>;

export class Endereco extends ValueObject<EnderecoProps> {
  private constructor(props: EnderecoProps) {
    super(props);
  }

  get cep(): string | null {
    return this.props.cep;
  }
  get logradouro(): string | null {
    return this.props.logradouro;
  }
  get numero(): string | null {
    return this.props.numero;
  }
  get complemento(): string | null {
    return this.props.complemento;
  }
  get bairro(): string | null {
    return this.props.bairro;
  }
  get cidade(): string | null {
    return this.props.cidade;
  }
  get uf(): string | null {
    return this.props.uf;
  }

  public formatado(): string {
    return [
      [this.props.logradouro, this.props.numero].filter(Boolean).join(', '),
      this.props.complemento,
      this.props.bairro,
      [this.props.cidade, this.props.uf].filter(Boolean).join('/'),
      this.props.cep ? `CEP ${this.props.cep}` : null,
    ]
      .filter((parte) => Boolean(parte))
      .join(' — ');
  }

  public toJSON(): EnderecoProps {
    return { ...this.props };
  }

  public static create(value: EnderecoValue): Result<Endereco> {
    const cep = value.cep ? value.cep.replace(/\D/g, '') : null;
    if (cep && cep.length !== 8) return Result.fail(new Error('CEP deve conter 8 dígitos'));

    const uf = value.uf ? value.uf.trim().toUpperCase() : null;
    if (uf && !/^[A-Z]{2}$/.test(uf)) return Result.fail(new Error('UF deve conter 2 letras'));

    return Result.ok(
      new Endereco({
        cep,
        logradouro: value.logradouro?.trim() || null,
        numero: value.numero?.trim() || null,
        complemento: value.complemento?.trim() || null,
        bairro: value.bairro?.trim() || null,
        cidade: value.cidade?.trim() || null,
        uf,
      }),
    );
  }

  public static reconstitute(props: EnderecoProps): Endereco {
    return new Endereco(props);
  }
}
