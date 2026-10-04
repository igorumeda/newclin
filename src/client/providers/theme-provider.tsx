'use client';

import { useEffect, type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { Tema } from '@/modules/organization/domain/value-objects/tema.vo';
import type { TemaProps } from '@/modules/organization/domain/value-objects/tema.vo';
import { organizacaoService } from '../services/organizacao.service';
import { criarTokensTema } from '../styles/tema-tokens';

export type RedeTema = TemaProps;

/**
 * Tema por rede (§3.7) aplicado em runtime: apenas as cores mudam — tipografia,
 * espaçamento e layout continuam vindo do design system.
 * A troca é imediata, sem recarregar a página (variáveis CSS no `<html>`).
 */
function RedeThemeApplier({ tema }: { tema: RedeTema | null }) {
  useEffect(() => {
    const raiz = document.documentElement;
    const atual = tema ? Tema.reconstitute(tema) : Tema.defaultPreset();
    const light = criarTokensTema({ cores: atual.light, modo: 'light' });
    const dark = criarTokensTema({ cores: atual.dark, modo: 'dark' });

    for (const token of Object.keys(light)) {
      raiz.style.removeProperty(token);
    }

    // Ambos os modos ficam no CSS: variáveis inline teriam prioridade sobre .dark.
    let styleTag = document.getElementById('rede-tema-dark') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'rede-tema-dark';
      document.head.appendChild(styleTag);
    }

    const declaracoesLight = Object.entries(light)
      .map(([token, valor]) => `${token}: ${valor};`)
      .join(' ');
    const declaracoes = Object.entries(dark)
      .map(([token, valor]) => `${token}: ${valor};`)
      .join(' ');

    styleTag.textContent = `:root { ${declaracoesLight} } :root.dark { ${declaracoes} }`;
  }, [tema]);

  return null;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
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
