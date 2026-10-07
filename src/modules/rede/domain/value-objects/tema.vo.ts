import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import { CorHsl } from './cor-hsl.vo';

export const CHAVES_TEMA = [
  'primary',
  'primaryForeground',
  'secondary',
  'accent',
  'background',
  'foreground',
  'border',
  'sidebar',
  'sidebarForeground',
] as const;

export type ChaveTema = (typeof CHAVES_TEMA)[number];
export type TemaCores = Record<ChaveTema, string>;
export type TemaProps = { cores: TemaCores; preset: string };
export type CriarTemaParams = { cores?: Partial<TemaCores>; preset?: string };

export const TEMA_PADRAO: TemaCores = {
  primary: '199 89% 48%',
  primaryForeground: '210 40% 98%',
  secondary: '210 40% 96.1%',
  accent: '210 40% 96.1%',
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  border: '214.3 31.8% 91.4%',
  sidebar: '222.2 84% 4.9%',
  sidebarForeground: '210 40% 98%',
};

export type PresetTema = { id: string; nome: string; cores: TemaCores };

/** Presets exigidos pela spec §3.7 (mínimo de 4). */
export const PRESETS_TEMA: PresetTema[] = [
  { id: 'azul_saude', nome: 'Azul Saúde', cores: { ...TEMA_PADRAO } },
  {
    id: 'verde',
    nome: 'Verde Clínico',
    cores: {
      ...TEMA_PADRAO,
      primary: '142.1 76.2% 36.3%',
      primaryForeground: '355.7 100% 97.3%',
      sidebar: '155 45% 12%',
    },
  },
  {
    id: 'roxo',
    nome: 'Roxo',
    cores: {
      ...TEMA_PADRAO,
      primary: '262.1 83.3% 57.8%',
      primaryForeground: '210 40% 98%',
      sidebar: '263 50% 13%',
    },
  },
  {
    id: 'escuro',
    nome: 'Grafite',
    cores: {
      ...TEMA_PADRAO,
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '222.2 47.4% 11.2%',
      sidebar: '224 71% 4%',
    },
  },
];

export class Tema extends ValueObject<TemaProps> {
  private constructor(props: TemaProps) {
    super(props);
  }

  get cores(): TemaCores {
    return { ...this.props.cores };
  }

  get preset(): string {
    return this.props.preset;
  }

  public static create(params: CriarTemaParams): Result<Tema> {
    const cores: TemaCores = { ...TEMA_PADRAO };
    for (const chave of CHAVES_TEMA) {
      const informada = params.cores?.[chave];
      if (informada === undefined) continue;
      const corResult = CorHsl.create(informada);
      if (corResult.isFailure) return Result.propagate(corResult);
      cores[chave] = corResult.value.value;
    }
    return Result.ok(new Tema({ cores, preset: params.preset ?? 'personalizado' }));
  }

  public static reconstitute(props: TemaProps): Tema {
    return new Tema(props);
  }

  public static padrao(): Tema {
    return new Tema({ cores: { ...TEMA_PADRAO }, preset: 'azul_saude' });
  }
}
