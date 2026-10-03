import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type SexoValue = 'feminino' | 'masculino' | 'outro' | 'nao_informado';

export const SEXO_VALUES: SexoValue[] = ['feminino', 'masculino', 'outro', 'nao_informado'];

export const SEXO_LABELS: Record<SexoValue, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  outro: 'Outro',
  nao_informado: 'Não informado',
};

export type SexoProps = { valor: SexoValue };

export class Sexo extends ValueObject<SexoProps> {
  private constructor(props: SexoProps) {
    super(props);
  }

  get valor(): SexoValue {
    return this.props.valor;
  }

  /** Alias de compatibilidade com os use cases existentes. */
  get value(): SexoValue {
    return this.props.valor;
  }

  get label(): string {
    return SEXO_LABELS[this.props.valor];
  }

  public static create(valor: string): Result<Sexo> {
    const normalizado = (valor ?? '').trim().toLowerCase() as SexoValue;

    if (!SEXO_VALUES.includes(normalizado)) {
      return Result.fail(
        new Error('Sexo é obrigatório (feminino, masculino, outro ou não informado)'),
      );
    }

    return Result.ok(new Sexo({ valor: normalizado }));
  }

  public static reconstitute(valor: SexoValue): Sexo {
    return new Sexo({ valor });
  }
}
