import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type EnderecoProps = {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
};

export type CriarEnderecoParams = Partial<EnderecoProps>;

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
] as const;

export class Endereco extends ValueObject<EnderecoProps> {
  private constructor(props: EnderecoProps) {
    super(props);
  }

  get logradouro(): string {
    return this.props.logradouro;
  }

  get cidade(): string {
    return this.props.cidade;
  }

  get uf(): string {
    return this.props.uf;
  }

  get cep(): string {
    return this.props.cep;
  }

  get completo(): string {
    const partes = [
      [this.props.logradouro, this.props.numero].filter(Boolean).join(', '),
      this.props.complemento,
      this.props.bairro,
      [this.props.cidade, this.props.uf].filter(Boolean).join('/'),
      this.props.cep,
    ];
    return partes.filter((parte) => parte && parte.trim().length > 0).join(' — ');
  }

  get valores(): EnderecoProps {
    return { ...this.props };
  }

  public static create(params: CriarEnderecoParams): Result<Endereco> {
    const uf = (params.uf ?? '').toUpperCase().trim();
    if (uf && !UFS.includes(uf as (typeof UFS)[number])) {
      return Result.fail(new Error(`UF inválida: ${params.uf}`));
    }
    const cep = (params.cep ?? '').replace(/\D+/g, '');
    if (cep && cep.length !== 8) {
      return Result.fail(new Error('CEP deve ter 8 dígitos'));
    }
    return Result.ok(
      new Endereco({
        logradouro: (params.logradouro ?? '').trim(),
        numero: (params.numero ?? '').trim(),
        complemento: (params.complemento ?? '').trim(),
        bairro: (params.bairro ?? '').trim(),
        cidade: (params.cidade ?? '').trim(),
        uf,
        cep,
      }),
    );
  }

  public static reconstitute(props: EnderecoProps): Endereco {
    return new Endereco(props);
  }

  public static vazio(): Endereco {
    return new Endereco({
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
    });
  }
}
