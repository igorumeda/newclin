import type { Metadata, Viewport } from 'next';
import '@/client/styles/globals.css';
import { AppProviders } from '@/client/providers/app-providers';

export const metadata: Metadata = {
  title: {
    default: 'Clínica SaaS — gestão de clínicas e prontuário eletrônico',
    template: '%s · Clínica SaaS',
  },
  description:
    'Sistema multi-tenant para redes de clínicas: agenda, recepção, prontuário eletrônico, documentos clínicos e relatórios.',
  applicationName: 'Clínica SaaS',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Clínica SaaS' },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
