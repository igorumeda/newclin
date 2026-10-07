import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const CONSELHOS = ['CRM', 'CRO', 'CRP', 'CREFITO', 'COREN', 'CRN', 'CRFa', 'OUTRO'] as const;
export type ConselhoValue = (typeof CONSELHOS)[number];

export type RegistroConselhoProps = { conselho: ConselhoValue; numero: string; uf: string | null };
export type CriarRegistroConselhoParams = { conselho: string; numero: string; uf?: string | null };

export class RegistroConselho extends ValueObject<RegistroConselhoProps> {
  private constructor(props: RegistroConselhoProps) {
    super(props);
  }

  get conselho(): ConselhoValue {
    return this.props.conselho;
  }

  get numero(): string {
    return this.props.numero;
  }

  get uf(): string | null {
    return this.props.uf;
  }

  get formatado(): string {
    return `${this.props.conselho} ${this.props.numero}${this.props.uf ? `/${this.props.uf}` : ''}`;
  }

  public static create(params: CriarRegistroConselhoParams): Result<RegistroConselho> {
    const conselho = (params.conselho ?? '').toUpperCase().trim() as ConselhoValue;
    if (!CONSELHOS.includes(conselho)) {
      return Result.fail(new Error(`Conselho de classe inválido: ${params.conselho}`));
    }
    const numero = (params.numero ?? '').trim();
    if (numero.length < 3) {
      return Result.fail(new Error('Número do conselho deve ter no mínimo 3 caracteres'));
    }
    const uf = params.uf ? params.uf.toUpperCase().trim() : null;
    if (uf && uf.length !== 2) {
      return Result.fail(new Error('UF do conselho deve ter 2 letras'));
    }
    return Result.ok(new RegistroConselho({ conselho, numero, uf }));
  }

  public static reconstitute(props: RegistroConselhoProps): RegistroConselho {
    return new RegistroConselho(props);
  }
}
