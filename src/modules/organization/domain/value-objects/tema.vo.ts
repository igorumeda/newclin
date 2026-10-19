import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import { TemaInvalidoError } from '../errors/tema-invalido.error';
import { TEMA_PRESETS } from './tema-presets';
export { TEMA_PRESETS } from './tema-presets';

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
  presetsPersonalizados?: TemaPreset[];
};

export type NovoTemaPreset = { nome: string; descricao?: string };
export type EditarTemaPreset = NovoTemaPreset & {
  id: string;
  coresLight?: Partial<TemaCores>;
  coresDark?: Partial<TemaCores>;
};
export type AtualizarTemaParams = {
  preset?: string;
  coresLight?: Partial<TemaCores>;
  coresDark?: Partial<TemaCores>;
  novoPreset?: NovoTemaPreset;
  editarPreset?: EditarTemaPreset;
  excluirPreset?: string;
};
type PresetId = string;
type CorHsl = string;

export type TemaPreset = {
  id: string;
  nome: string;
  descricao: string;
  light: TemaCores;
  dark: TemaCores;
};

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
    return {
      preset: this.props.preset,
      light: this.light,
      dark: this.dark,
      presetsPersonalizados: this.presetsPersonalizados,
    };
  }

  get presetsPersonalizados(): TemaPreset[] {
    return (this.props.presetsPersonalizados ?? []).map((item) => ({
      ...item,
      light: { ...item.light },
      dark: { ...item.dark },
    }));
  }

  public selecionarPreset(id: PresetId): Result<Tema> {
    const personalizado = this.presetsPersonalizados.find((item) => item.id === id);
    const base = personalizado
      ? Tema.create({
          preset: id,
          light: { ...Tema.defaultPreset().light, ...personalizado.light },
          dark: { ...Tema.defaultPreset().dark, ...personalizado.dark },
        })
      : Tema.fromPreset(id);
    if (base.isFailure) return Result.fail(base.error);
    return Tema.create({
      ...base.value.toJSON(),
      presetsPersonalizados: this.presetsPersonalizados,
    });
  }

  public atualizar(params: AtualizarTemaParams): Result<Tema> {
    if (params.editarPreset && params.excluirPreset)
      return Result.fail(new TemaInvalidoError({ reason: 'Escolha uma ação por vez.' }));
    if (params.excluirPreset) return this.excluirPreset(params.excluirPreset);
    if (params.editarPreset) return this.editarPreset(params.editarPreset);
    const base = params.preset ? this.selecionarPreset(params.preset) : Result.ok(this);
    if (base.isFailure) return Result.fail(base.error);
    const light = { ...base.value.light, ...params.coresLight };
    const dark = { ...base.value.dark, ...params.coresDark };
    const mudou =
      Object.entries(light).some(
        ([token, cor]) => cor !== base.value.light[token as keyof TemaCores],
      ) ||
      Object.entries(dark).some(
        ([token, cor]) => cor !== base.value.dark[token as keyof TemaCores],
      );
    if (!params.novoPreset && mudou && !base.value.editavel) {
      return Result.fail(
        new TemaInvalidoError({
          reason:
            'Os presets do sistema são protegidos. Duplique o preset para editar suas cores.',
        }),
      );
    }
    const atualizado = Tema.create({
      ...base.value.toJSON(),
      light,
      dark,
    });
    if (atualizado.isFailure) return atualizado;
    if (params.novoPreset) return atualizado.value.salvarComoPreset(params.novoPreset);
    return Tema.create({
      ...atualizado.value.toJSON(),
      presetsPersonalizados: atualizado.value.presetsPersonalizados.map((item) =>
        item.id === atualizado.value.preset ? { ...item, light, dark } : item,
      ),
    });
  }

  get editavel(): boolean {
    return (
      !Tema.presetDoSistema(this.preset) &&
      this.presetsPersonalizados.some((item) => item.id === this.preset)
    );
  }

  public editarPreset(params: EditarTemaPreset): Result<Tema> {
    const origem = this.presetsPersonalizados.find((item) => item.id === params.id);
    if (Tema.presetDoSistema(params.id) || !origem)
      return Result.fail(
        new TemaInvalidoError({
          reason: 'Somente presets personalizados da rede podem ser editados.',
        }),
      );
    // Reutiliza a validação de nome e descrição, desconsiderando o próprio preset.
    const validacao = Tema.create({
      ...this.toJSON(),
      presetsPersonalizados: this.presetsPersonalizados.filter(
        (item) => item.id !== params.id,
      ),
    });
    if (validacao.isFailure) return validacao;
    const nome = validacao.value.salvarComoPreset(params);
    if (nome.isFailure) return nome;
    const atualizado = {
      ...origem,
      nome: params.nome.trim(),
      descricao: params.descricao?.trim() ?? '',
      light: { ...origem.light, ...params.coresLight },
      dark: { ...origem.dark, ...params.coresDark },
    };
    const cores = Tema.create({
      ...this.toJSON(),
      light: atualizado.light,
      dark: atualizado.dark,
    });
    if (cores.isFailure) return cores;
    return Tema.create({
      ...this.toJSON(),
      ...(this.preset === params.id
        ? { light: atualizado.light, dark: atualizado.dark }
        : {}),
      presetsPersonalizados: this.presetsPersonalizados.map((item) =>
        item.id === params.id ? atualizado : item,
      ),
    });
  }

  public excluirPreset(id: PresetId): Result<Tema> {
    if (
      Tema.presetDoSistema(id) ||
      !this.presetsPersonalizados.some((item) => item.id === id)
    )
      return Result.fail(
        new TemaInvalidoError({
          reason: 'Somente presets personalizados da rede podem ser excluídos.',
        }),
      );
    const restantes = this.presetsPersonalizados.filter((item) => item.id !== id);
    return Tema.create({
      ...(this.preset === id ? Tema.defaultPreset().toJSON() : this.toJSON()),
      presetsPersonalizados: restantes,
    });
  }

  public static presetDoSistema(id: PresetId): boolean {
    return TEMA_PRESETS.some((item) => item.id === id);
  }

  public salvarComoPreset(params: NovoTemaPreset): Result<Tema> {
    const nome = params.nome.trim();
    const descricao = params.descricao?.trim() ?? '';
    const slug = nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 35);
    const id = `rede-${slug}`;
    const existentes = [...TEMA_PRESETS, ...this.presetsPersonalizados];
    if (nome.length < 3 || nome.length > 60 || !slug || descricao.length > 160) {
      return Result.fail(
        new TemaInvalidoError({
          reason:
            'Informe um nome entre 3 e 60 caracteres e uma descrição de até 160 caracteres.',
        }),
      );
    }
    if (
      existentes.some(
        (item) => item.id === id || item.nome.toLowerCase() === nome.toLowerCase(),
      )
    ) {
      return Result.fail(
        new TemaInvalidoError({
          reason: 'Já existe um preset com esse nome. Escolha outro nome.',
        }),
      );
    }
    const novo: TemaPreset = { id, nome, descricao, light: this.light, dark: this.dark };
    return Tema.create({
      ...this.toJSON(),
      preset: id,
      presetsPersonalizados: [...this.presetsPersonalizados, novo],
    });
  }

  public static corValida(valor: CorHsl): boolean {
    if (!HSL_PATTERN.test(valor)) return false;
    const [h, s, l] = valor.replace(/%/g, '').split(/\s+/).map(Number);
    return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
  }

  public static defaultPreset(): Tema {
    const preset = TEMA_PRESETS[0];
    return new Tema({
      preset: preset.id,
      light: { ...preset.light },
      dark: { ...preset.dark },
    });
  }

  public static fromPreset(presetId: PresetId): Result<Tema> {
    const preset = TEMA_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return Result.fail(
        new TemaInvalidoError({ reason: `Preset de tema inválido: "${presetId}"` }),
      );
    }

    return Result.ok(
      new Tema({
        preset: preset.id,
        light: { ...preset.light },
        dark: { ...preset.dark },
      }),
    );
  }

  public static create(props: TemaProps): Result<Tema> {
    const cores = [...Object.entries(props.light), ...Object.entries(props.dark)];

    const invalida = cores.find(([, valor]) => !Tema.corValida(String(valor)));
    if (invalida) {
      return Result.fail(
        new TemaInvalidoError({
          reason: `Cor inválida em "${invalida[0]}": use o formato HSL "H S% L%" (ex.: "199 89% 48%")`,
        }),
      );
    }

    return Result.ok(
      new Tema({
        ...props,
        light: { ...props.light },
        dark: { ...props.dark },
        presetsPersonalizados: (props.presetsPersonalizados ?? []).map((item) => ({
          ...item,
          light: { ...item.light },
          dark: { ...item.dark },
        })),
      }),
    );
  }

  public static reconstitute(props: TemaProps): Tema {
    const sistema = TEMA_PRESETS.find((item) => item.id === props.preset);
    const personalizado = props.presetsPersonalizados?.some(
      (item) => item.id === props.preset,
    );
    // Temas antigos passam ao novo padrão; presets criados pela rede são preservados.
    const base = sistema ?? (!personalizado ? TEMA_PRESETS[0] : null);
    return new Tema(
      base
        ? { ...props, preset: base.id, light: { ...base.light }, dark: { ...base.dark } }
        : props,
    );
  }
}
