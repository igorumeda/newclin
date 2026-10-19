import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type ConselhoClasse = 'CRM' | 'CRO' | 'COREN' | 'CRP' | 'CREFITO' | 'CRFA' | 'CRN' | 'OUTRO';

export const CONSELHOS_CLASSE: ConselhoClasse[] = [
  'CRM',
  'CRO',
  'COREN',
  'CRP',
  'CREFITO',
  'CRFA',
  'CRN',
  'OUTRO',
];

export type RegistroConselhoProps = {
  conselhoClasse: ConselhoClasse;
  numero: string;
  uf: string | null;
};

export type RegistroConselhoValue = {
  conselhoClasse: string;
  numero: string;
  uf?: string | null;
};

/** Número do conselho de classe (CRM, CRO, ...) — identifica o profissional. */
export class RegistroConselho extends ValueObject<RegistroConselhoProps> {
  private constructor(props: RegistroConselhoProps) {
    super(props);
  }

  get conselhoClasse(): ConselhoClasse {
    return this.props.conselhoClasse;
  }
  get numero(): string {
    return this.props.numero;
  }
  get uf(): string | null {
    return this.props.uf;
  }

  public formatado(): string {
    return [this.props.conselhoClasse, this.props.numero, this.props.uf].filter(Boolean).join(' ');
  }

  public static create(value: RegistroConselhoValue): Result<RegistroConselho> {
    const conselhoClasse = (value.conselhoClasse ?? '').trim().toUpperCase() as ConselhoClasse;
    const numero = (value.numero ?? '').trim();
    const uf = value.uf ? value.uf.trim().toUpperCase() : null;

    if (!CONSELHOS_CLASSE.includes(conselhoClasse)) {
      return Result.fail(new Error('Conselho de classe inválido (ex.: CRM, CRO, COREN)'));
    }
    if (numero.length < 3 || numero.length > 20) {
      return Result.fail(new Error('Número do conselho deve ter entre 3 e 20 caracteres'));
    }
    if (uf && !/^[A-Z]{2}$/.test(uf)) {
      return Result.fail(new Error('UF do conselho deve conter 2 letras (ex: SP)'));
    }

    return Result.ok(new RegistroConselho({ conselhoClasse, numero, uf }));
  }

  public static reconstitute(props: RegistroConselhoProps): RegistroConselho {
    return new RegistroConselho(props);
  }
}
