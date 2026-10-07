import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { FONTES_WEB, VARIAVEIS_FONTES } from '@/client/config/fonts.config';
import '@/client/styles/globals.css';

export const metadata: Metadata = {
  title: 'Clínica · Gestão de redes de saúde',
  description:
    'Sistema multi-tenant de gestão clínica: agenda, prontuário eletrônico, documentos e relatórios.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};

export type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning style={VARIAVEIS_FONTES as CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {FONTES_WEB.map((fonte) => (
          <link key={fonte.familia} rel="stylesheet" href={fonte.href} />
        ))}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
