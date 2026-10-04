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

/** Combinações inspiradas nas escalas e superfícies de Geist e Atlassian Design. */
function paleta(params: PaletaParams): TemaPreset {
  const { base, destaque } = params;
  const light: TemaCores = {
    primary: params.primaryLight,
    primaryForeground: '0 0% 100%',
    secondary: `${destaque} 24% 92%`,
    secondaryForeground: `${destaque} 35% 18%`,
    accent: `${destaque} 35% 94%`,
    accentForeground: `${destaque} 45% 22%`,
    background: `${base} 20% 98%`,
    foreground: `${base} 25% 12%`,
    border: `${base} 16% 84%`,
    sidebar: params.sidebarClara ? `${base} 24% 96%` : `${base} 28% 12%`,
    sidebarForeground: params.sidebarClara ? `${base} 30% 16%` : `${base} 15% 96%`,
  };
  const dark: TemaCores = {
    primary: params.primaryDark,
    primaryForeground: `${base} 25% 8%`,
    secondary: `${destaque} 20% 18%`,
    secondaryForeground: `${destaque} 25% 92%`,
    accent: `${destaque} 24% 20%`,
    accentForeground: `${destaque} 35% 90%`,
    background: `${base} 20% 7%`,
    foreground: `${base} 15% 96%`,
    border: `${base} 14% 27%`,
    sidebar: params.sidebarClara ? `${base} 18% 92%` : `${base} 25% 5%`,
    sidebarForeground: params.sidebarClara ? `${base} 30% 16%` : `${base} 15% 96%`,
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
    primaryLight: '218 80% 42%',
    primaryDark: '210 90% 72%',
    base: 218,
    destaque: 190,
  }),
  paleta({
    id: 'jade',
    nome: 'Jade Suave',
    descricao: 'Verde jade, areia e barra lateral em menta clara.',
    primaryLight: '158 65% 28%',
    primaryDark: '158 60% 68%',
    base: 150,
    destaque: 42,
    sidebarClara: true,
  }),
  paleta({
    id: 'iris',
    nome: 'Íris',
    descricao: 'Índigo com lavanda e cinzas azulados.',
    primaryLight: '245 65% 45%',
    primaryDark: '245 80% 78%',
    base: 240,
    destaque: 280,
  }),
  paleta({
    id: 'terracota',
    nome: 'Areia Quente',
    descricao: 'Terracota, pêssego e barra lateral em areia clara.',
    primaryLight: '18 65% 34%',
    primaryDark: '22 80% 72%',
    base: 25,
    destaque: 35,
    sidebarClara: true,
  }),
  paleta({
    id: 'aurora',
    nome: 'Aurora',
    descricao: 'Rosa profundo com lilás e ameixa.',
    primaryLight: '340 70% 38%',
    primaryDark: '340 80% 76%',
    base: 320,
    destaque: 275,
  }),
  paleta({
    id: 'petroleo',
    nome: 'Petróleo',
    descricao: 'Azul petróleo com menta e ardósia.',
    primaryLight: '185 75% 26%',
    primaryDark: '180 65% 68%',
    base: 200,
    destaque: 160,
  }),
  paleta({
    id: 'ambar',
    nome: 'Âmbar',
    descricao: 'Dourado queimado com oliva e tons de pedra.',
    primaryLight: '38 95% 30%',
    primaryDark: '42 90% 70%',
    base: 35,
    destaque: 85,
  }),
  paleta({
    id: 'lavanda',
    nome: 'Lavanda',
    descricao: 'Violeta com rosa suave e fundos delicados.',
    primaryLight: '270 55% 42%',
    primaryDark: '270 70% 78%',
    base: 270,
    destaque: 325,
  }),
  paleta({
    id: 'grafite',
    nome: 'Prata',
    descricao: 'Grafite, azul discreto e barra lateral em prata clara.',
    primaryLight: '220 12% 20%',
    primaryDark: '220 15% 85%',
    base: 220,
    destaque: 210,
    sidebarClara: true,
  }),
  paleta({
    id: 'cobalto',
    nome: 'Cobalto',
    descricao: 'Azul cobalto com acentos dourados e marinho.',
    primaryLight: '225 85% 43%',
    primaryDark: '225 90% 76%',
    base: 225,
    destaque: 45,
  }),
]);
