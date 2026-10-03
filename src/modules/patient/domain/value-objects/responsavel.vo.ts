import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type ResponsavelProps = {
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  parentesco: string | null;
};

export type ResponsavelValue = Partial<ResponsavelProps>;

export const PARENTESCOS = [
  'mae',
  'pai',
  'avo',
  'tutor',
  'irmao',
  'conjuge',
  'outro',
] as const;

export type Parentesco = (typeof PARENTESCOS)[number];

export const PARENTESCO_LABELS: Record<Parentesco, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  avo: 'Avô/Avó',
  tutor: 'Tutor(a) legal',
  irmao: 'Irmão/Irmã',
  conjuge: 'Cônjuge',
  outro: 'Outro',
};

/** Responsável legal — obrigatório para pacientes menores de 18 anos (§3.3). */
export class Responsavel extends ValueObject<ResponsavelProps> {
  private constructor(props: ResponsavelProps) {
    super(props);
  }

  get nome(): string | null {
    return this.props.nome;
  }
  get cpf(): string | null {
    return this.props.cpf;
  }
  get telefone(): string | null {
    return this.props.telefone;
  }
  get parentesco(): string | null {
    return this.props.parentesco;
  }

  public informado(): boolean {
    return Boolean(this.props.nome && this.props.nome.trim().length >= 3);
  }

  public static create(value: ResponsavelValue): Result<Responsavel> {
    const nome = value.nome?.trim() || null;
    if (nome && nome.length < 3) {
      return Result.fail(new Error('Nome do responsável deve ter ao menos 3 caracteres'));
    }

    const cpf = value.cpf ? value.cpf.replace(/\D/g, '') : null;
    if (cpf && cpf.length !== 11) {
      return Result.fail(new Error('CPF do responsável deve conter 11 dígitos'));
    }

    const telefone = value.telefone ? value.telefone.replace(/\D/g, '') : null;
    const parentesco = value.parentesco?.trim().toLowerCase() || null;

    if (parentesco && !PARENTESCOS.includes(parentesco as Parentesco)) {
      return Result.fail(new Error('Parentesco inválido'));
    }

    return Result.ok(
      new Responsavel({
        nome,
        cpf,
        telefone,
        parentesco,
      }),
    );
  }

  public static reconstitute(props: ResponsavelProps): Responsavel {
    return new Responsavel(props);
  }
}
