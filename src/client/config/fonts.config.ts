/**
 * Tipografia do design system. As famílias são carregadas por `<link>` no
 * layout raiz (não em build time), de modo que o build funcione offline e a
 * pilha de fallback do sistema seja usada caso o CDN esteja indisponível.
 */
export type FonteWeb = { href: string; familia: string };

export const FONTE_SANS: FonteWeb = {
  familia: 'Inter',
  href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
};

export const FONTE_MONO: FonteWeb = {
  familia: 'JetBrains Mono',
  href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
};

export const FONTES_WEB: FonteWeb[] = [FONTE_SANS, FONTE_MONO];

/** Variáveis consumidas por `tailwind.config.ts` (`--font-sans` / `--font-mono`). */
export const VARIAVEIS_FONTES = {
  '--font-sans': `'${FONTE_SANS.familia}'`,
  '--font-mono': `'${FONTE_MONO.familia}'`,
} as const;
