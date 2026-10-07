/** Aplicação do tema da rede em CSS custom properties (sem cores hardcoded). */
export type VariaveisTema = Record<string, string>;
export type AplicarTemaParams = { cores: VariaveisTema };

const MAPA_VARIAVEIS: Record<string, string> = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  accent: '--accent',
  background: '--background',
  foreground: '--foreground',
  border: '--border',
  sidebar: '--sidebar-bg',
  sidebarForeground: '--sidebar-foreground',
};

export function aplicarTema({ cores }: AplicarTemaParams): void {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  Object.entries(cores).forEach(([chave, valor]) => {
    const variavel = MAPA_VARIAVEIS[chave];
    if (variavel && valor) raiz.style.setProperty(variavel, valor);
  });
}
