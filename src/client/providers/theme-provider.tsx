'use client';

import { useEffect, type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { TEMA_PRESETS } from '@/modules/organization/domain/value-objects/tema.vo';
import { organizacaoService } from '../services/organizacao.service';

export type RedeTema = {
  preset: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};

/**
 * Tema por rede (§3.7) aplicado em runtime: apenas as cores mudam — tipografia,
 * espaçamento e layout continuam vindo do design system.
 * A troca é imediata, sem recarregar a página (variáveis CSS no `<html>`).
 */
function RedeThemeApplier({ tema }: { tema: RedeTema | null }) {
  useEffect(() => {
    const raiz = document.documentElement;
    const preset = TEMA_PRESETS.find((item) => item.id === tema?.preset) ?? TEMA_PRESETS[0];

    const light = { ...preset.light, ...(tema?.light ?? {}) };
    const dark = { ...preset.dark, ...(tema?.dark ?? {}) };

    // Os presets usam camelCase (primaryForeground) e o CSS usa kebab-case.
    const paraVariavelCss = (token: string) => `--${token.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;

    for (const [token, valor] of Object.entries(light)) {
      raiz.style.setProperty(paraVariavelCss(token), valor);
    }

    // O modo escuro é aplicado pela classe `.dark`; as variáveis do tema escuro
    // são gravadas em um bloco <style> para valerem apenas nesse modo.
    let styleTag = document.getElementById('rede-tema-dark') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'rede-tema-dark';
      document.head.appendChild(styleTag);
    }

    const declaracoes = Object.entries(dark)
      .map(([token, valor]) => `${paraVariavelCss(token)}: ${valor};`)
      .join(' ');

    styleTag.textContent = `.dark { ${declaracoes} }`;
  }, [tema]);

  return null;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <RedeThemeApplierBridge>{children}</RedeThemeApplierBridge>
    </NextThemesProvider>
  );
}

/** Lê o tema da rede (tenant) e o aplica em runtime (§3.7). */
function RedeThemeApplierBridge({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ['organizacao', 'tema'],
    queryFn: () => organizacaoService.obter(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const tema = (data?.tema as RedeTema | undefined) ?? null;

  return (
    <>
      <RedeThemeApplier tema={tema} />
      {children}
    </>
  );
}
