import type { TemaCores, TemaPreset } from './tema.vo';

type PaletaParams = {
  id: string;
  nome: string;
  descricao: string;
  primaryLight: string;
  primaryDark: string;
  base: number;
  destaque: number;
  sidebarClara?: boolean;
};

/** Paletas tonais: a mesma família de cor permanece nos dois modos. */
function paleta(params: PaletaParams): TemaPreset {
  const { base, destaque } = params;
  const light: TemaCores = {
    primary: params.primaryLight,
    primaryForeground: '0 0% 100%',
    secondary: `${base} 24% 91%`,
    secondaryForeground: `${base} 35% 22%`,
    accent: `${destaque} 38% 91%`,
    accentForeground: `${base} 45% 24%`,
    background: `${base} 28% 96%`,
    foreground: `${base} 30% 16%`,
    border: `${base} 18% 79%`,
    sidebar: params.sidebarClara ? `${base} 32% 92%` : `${base} 32% 18%`,
    sidebarForeground: params.sidebarClara ? `${base} 35% 20%` : `${base} 22% 96%`,
  };
  const dark: TemaCores = {
    primary: params.primaryDark,
    primaryForeground: `${base} 25% 8%`,
    secondary: `${base} 22% 23%`,
    secondaryForeground: `${base} 24% 94%`,
    accent: `${destaque} 30% 25%`,
    accentForeground: `${destaque} 38% 91%`,
    background: `${base} 26% 11%`,
    foreground: `${base} 22% 94%`,
    border: `${base} 18% 35%`,
    sidebar: params.sidebarClara ? `${base} 24% 21%` : `${base} 30% 9%`,
    sidebarForeground: `${base} 22% 94%`,
  };
  return Object.freeze({
    id: params.id,
    nome: params.nome,
    descricao: params.descricao,
    light: Object.freeze(light),
    dark: Object.freeze(dark),
  });
}

export const TEMA_PRESETS: readonly TemaPreset[] = Object.freeze([
  paleta({
    id: 'oceano',
    nome: 'Oceano',
    descricao: 'Azul profundo, ciano suave e superfícies frias.',
    primaryLight: '205 80% 35%',
    primaryDark: '205 78% 70%',
    base: 205,
    destaque: 198,
  }),
  paleta({
    id: 'jade',
    nome: 'Jade Suave',
    descricao: 'Verde jade e menta, com superfícies suaves nos dois modos.',
    primaryLight: '158 65% 28%',
    primaryDark: '158 60% 68%',
    base: 158,
    destaque: 164,
    sidebarClara: true,
  }),
  paleta({
    id: 'iris',
    nome: 'Íris',
    descricao: 'Índigo com lavanda e cinzas azulados.',
    primaryLight: '245 65% 45%',
    primaryDark: '245 72% 76%',
    base: 245,
    destaque: 252,
  }),
  paleta({
    id: 'terracota',
    nome: 'Areia Quente',
    descricao: 'Terracota e pêssego, com superfícies quentes e suaves.',
    primaryLight: '18 65% 34%',
    primaryDark: '18 72% 72%',
    base: 18,
    destaque: 24,
    sidebarClara: true,
  }),
  paleta({
    id: 'aurora',
    nome: 'Aurora',
    descricao: 'Rosa profundo e ameixa, com superfícies de tom rosado.',
    primaryLight: '340 70% 38%',
    primaryDark: '340 80% 76%',
    base: 340,
    destaque: 334,
  }),
  paleta({
    id: 'petroleo',
    nome: 'Petróleo',
    descricao: 'Azul petróleo com menta e ardósia.',
    primaryLight: '185 75% 26%',
    primaryDark: '185 60% 68%',
    base: 185,
    destaque: 178,
  }),
  paleta({
    id: 'ambar',
    nome: 'Âmbar',
    descricao: 'Dourado queimado e mel, com superfícies de tom quente.',
    primaryLight: '38 95% 30%',
    primaryDark: '38 85% 70%',
    base: 38,
    destaque: 44,
  }),
  paleta({
    id: 'lavanda',
    nome: 'Lavanda',
    descricao: 'Violeta e lavanda, com fundos suaves nos dois modos.',
    primaryLight: '270 55% 42%',
    primaryDark: '270 70% 78%',
    base: 270,
    destaque: 278,
  }),
  paleta({
    id: 'grafite',
    nome: 'Prata',
    descricao: 'Grafite e prata, com azul discreto e superfícies suaves.',
    primaryLight: '220 12% 20%',
    primaryDark: '220 15% 85%',
    base: 220,
    destaque: 210,
    sidebarClara: true,
  }),
  paleta({
    id: 'cobalto',
    nome: 'Cobalto',
    descricao: 'Azul cobalto e marinho, com acentos da mesma família.',
    primaryLight: '225 85% 43%',
    primaryDark: '225 90% 76%',
    base: 225,
    destaque: 232,
  }),
]);
