import type { Metadata, Viewport } from 'next';
import '@/client/styles/globals.css';
import { AppProviders } from '@/client/providers/app-providers';
import { obterImagemPublica } from '@/shared/utils/public-images.util';

const faviconUrl =
  obterImagemPublica({
    caminho: 'logotipo/mini_logotipo_icone_bg_transparent.png',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  }) ?? '/icons/icone.svg';

export const metadata: Metadata = {
  title: {
    default: 'NewClin — Sua clínica no digital | Gestão de clínicas e prontuário eletrônico',
    template: '%s · NewClin',
  },
  description:
    'Sistema multi-tenant para redes de clínicas: agenda, recepção, prontuário eletrônico, documentos clínicos e relatórios.',
  applicationName: 'NewClin',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'NewClin' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020817' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

type RootLayoutProps = { children: React.ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
