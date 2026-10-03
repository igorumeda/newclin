import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

/**
 * Tema visual da rede (§3.7).
 * Altera apenas CORES — tipografia, espaçamentos e layout são fixos do design
 * system. As cores são tokens HSL no formato "H S% L%" (ex.: "199 89% 48%").
 */
export type TemaCores = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  border: string;
  sidebar: string;
  sidebarForeground: string;
};

export type TemaProps = {
  preset: string;
  light: TemaCores;
  dark: TemaCores;
};

export type TemaPreset = {
  id: string;
  nome: string;
  descricao: string;
  light: Pick<TemaCores, 'primary' | 'primaryForeground' | 'accent' | 'accentForeground' | 'sidebar'>;
  dark: Pick<TemaCores, 'primary' | 'primaryForeground' | 'accent' | 'accentForeground' | 'sidebar'>;
};

const NEUTRAS: Omit<TemaCores, 'primary' | 'primaryForeground' | 'secondary' | 'secondaryForeground' | 'accent' | 'accentForeground' | 'sidebar' | 'sidebarForeground'> = {
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  border: '214.3 31.8% 91.4%',
};

export const TEMA_PRESETS: TemaPreset[] = [
  {
    id: 'azul-saude',
    nome: 'Azul Saúde',
    descricao: 'Padrão do sistema — transmite confiança e limpeza.',
    light: {
      primary: '199 89% 48%',
      primaryForeground: '210 40% 98%',
      accent: '199 89% 95%',
      accentForeground: '222.2 47.4% 11.2%',
      sidebar: '222.2 84% 4.9%',
    },
    dark: {
      primary: '199 89% 55%',
      primaryForeground: '222.2 47.4% 11.2%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      sidebar: '224 71% 4%',
    },
  },
  {
    id: 'verde-clinico',
    nome: 'Verde Clínico',
    descricao: 'Sensação de saúde, equilíbrio e bem-estar.',
    light: {
      primary: '152 60% 40%',
      primaryForeground: '0 0% 100%',
      accent: '152 60% 95%',
      accentForeground: '222.2 47.4% 11.2%',
      sidebar: '160 40% 12%',
    },
    dark: {
      primary: '152 55% 50%',
      primaryForeground: '160 40% 8%',
      accent: '160 25% 18%',
      accentForeground: '0 0% 98%',
      sidebar: '160 40% 8%',
    },
  },
  {
    id: 'roxo-cuidado',
    nome: 'Roxo Cuidado',
    descricao: 'Identidade acolhedora para clínicas especializadas.',
    light: {
      primary: '262 83% 58%',
      primaryForeground: '210 40% 98%',
      accent: '262 83% 96%',
      accentForeground: '222.2 47.4% 11.2%',
      sidebar: '263 60% 15%',
    },
    dark: {
      primary: '263 70% 62%',
      primaryForeground: '222.2 47.4% 11.2%',
      accent: '263 30% 20%',
      accentForeground: '0 0% 98%',
      sidebar: '263 60% 8%',
    },
  },
  {
    id: 'escuro-profundo',
    nome: 'Escuro Profundo',
    descricao: 'Alto contraste, indicado para ambientes com pouca luz.',
    light: {
      primary: '222.2 47.4% 11.2%',
      primaryForeground: '210 40% 98%',
      accent: '210 40% 94%',
      accentForeground: '222.2 47.4% 11.2%',
      sidebar: '222.2 47.4% 11.2%',
    },
    dark: {
      primary: '210 40% 96%',
      primaryForeground: '222.2 47.4% 11.2%',
      accent: '217.2 32.6% 20%',
      accentForeground: '210 40% 98%',
      sidebar: '222.2 84% 3%',
    },
  },
];

const HSL_PATTERN = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/;

export class Tema extends ValueObject<TemaProps> {
  private constructor(props: TemaProps) {
    super(props);
  }

  get preset(): string {
    return this.props.preset;
  }
  get light(): TemaCores {
    return { ...this.props.light };
  }
  get dark(): TemaCores {
    return { ...this.props.dark };
  }

  public toJSON(): TemaProps {
    return { preset: this.props.preset, light: { ...this.props.light }, dark: { ...this.props.dark } };
  }

  public static defaultPreset(): Tema {
    const preset = TEMA_PRESETS[0];
    return new Tema({
      preset: preset.id,
      light: {
        ...NEUTRAS,
        secondary: '210 40% 96.1%',
        secondaryForeground: '222.2 47.4% 11.2%',
        ...preset.light,
        sidebarForeground: '210 40% 98%',
      },
      dark: {
        background: '222.2 84% 4.9%',
        foreground: '210 40% 98%',
        border: '217.2 32.6% 17.5%',
        secondary: '217.2 32.6% 17.5%',
        secondaryForeground: '210 40% 98%',
        ...preset.dark,
        sidebarForeground: '210 40% 98%',
      },
    });
  }

  public static fromPreset(presetId: string): Result<Tema> {
    const preset = TEMA_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return Result.fail(new Error(`Preset de tema inválido: "${presetId}"`));
    }

    return Result.ok(
      new Tema({
        preset: preset.id,
        light: {
          ...NEUTRAS,
          secondary: '210 40% 96.1%',
          secondaryForeground: '222.2 47.4% 11.2%',
          ...preset.light,
          sidebarForeground: '210 40% 98%',
        },
        dark: {
          background: '222.2 84% 4.9%',
          foreground: '210 40% 98%',
          border: '217.2 32.6% 17.5%',
          secondary: '217.2 32.6% 17.5%',
          secondaryForeground: '210 40% 98%',
          ...preset.dark,
          sidebarForeground: '210 40% 98%',
        },
      }),
    );
  }

  public static create(props: TemaProps): Result<Tema> {
    const cores = [
      ...Object.entries(props.light),
      ...Object.entries(props.dark),
    ];

    const invalida = cores.find(([, valor]) => !HSL_PATTERN.test(String(valor)));
    if (invalida) {
      return Result.fail(
        new Error(
          `Cor inválida em "${invalida[0]}": use o formato HSL "H S% L%" (ex.: "199 89% 48%")`,
        ),
      );
    }

    return Result.ok(new Tema(props));
  }

  public static reconstitute(props: TemaProps): Tema {
    return new Tema(props);
  }
}
