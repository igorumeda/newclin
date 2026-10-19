import type { TemaCores } from '@/modules/organization/domain/value-objects/tema.vo';

type CriarTokensTemaParams = { cores: TemaCores; modo: 'light' | 'dark' };
type TokensTema = Record<string, string>;
type NivelSuperficie = number;

/** Deriva as superfícies dos tokens salvos, inclusive para presets personalizados antigos. */
export function criarTokensTema({ cores, modo }: CriarTokensTemaParams): TokensTema {
  const [matiz, saturacao, luminosidade] = cores.background.match(/[\d.]+/g)!.map(Number);
  const escuro = modo === 'dark';
  const superficie = (nivel: NivelSuperficie) =>
    `${matiz} ${Math.min(saturacao, 24)}% ${Math.min(100, luminosidade + nivel)}%`;
  const tokens: TokensTema = {};
  for (const [chave, valor] of Object.entries(cores)) {
    const variavel =
      chave === 'sidebar'
        ? 'sidebar-bg'
        : chave.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
    tokens[`--${variavel}`] = valor;
  }
  return {
    ...tokens,
    '--card': superficie(escuro ? 5 : 3),
    '--card-foreground': cores.foreground,
    '--popover': superficie(escuro ? 8 : 4),
    '--popover-foreground': cores.foreground,
    '--muted': cores.secondary,
    '--muted-foreground': `${matiz} 14% ${escuro ? 74 : 38}%`,
    '--input': cores.border,
    '--ring': cores.primary,
    '--header-bg': superficie(escuro ? 5 : 3),
    '--header-border': cores.border,
    '--footer-bg': superficie(escuro ? 5 : 3),
  };
}
