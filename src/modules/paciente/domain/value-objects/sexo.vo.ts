import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const SEXOS = ['feminino', 'masculino', 'outro', 'nao_informado'] as const;
export type SexoValue = (typeof SEXOS)[number];
export type SexoProps = { value: SexoValue };

export const ROTULO_SEXO: Record<SexoValue, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  outro: 'Outro',
  nao_informado: 'Não informado',
};

const SINONIMOS: Record<string, SexoValue> = {
  f: 'feminino',
  fem: 'feminino',
  feminino: 'feminino',
  mulher: 'feminino',
  m: 'masculino',
  masc: 'masculino',
  masculino: 'masculino',
  homem: 'masculino',
  o: 'outro',
  outro: 'outro',
};

export class Sexo extends ValueObject<SexoProps> {
  private constructor(props: SexoProps) {
    super(props);
  }

  get value(): SexoValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_SEXO[this.props.value];
  }

  public static create(sexo: string): Result<Sexo> {
    const normalizado = (sexo ?? '').trim().toLowerCase();
    if (!normalizado) return Result.ok(new Sexo({ value: 'nao_informado' }));
    const encontrado = SINONIMOS[normalizado] ?? (SEXOS.includes(normalizado as SexoValue) ? (normalizado as SexoValue) : null);
    if (!encontrado) return Result.fail(new Error(`Sexo inválido: ${sexo}`));
    return Result.ok(new Sexo({ value: encontrado }));
  }

  public static reconstitute(value: SexoValue): Sexo {
    return new Sexo({ value });
  }
}
