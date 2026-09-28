Vou criar o arquivo `agents/design-system.md` com todas as definições de layout, componentes e configurações visuais. Depois mostro como atualizar o `AGENTS.md` para referenciá-lo.

---

# Design System — Guia Completo de Layout e Componentes Visuais

> **Este documento é a fonte única de verdade para a identidade visual e
> padrões de UI de todos os sistemas deste ecossistema. Todo agente de IA
> e todo desenvolvedor DEVE seguir estas regras à risca para garantir
> homogeneidade visual entre todos os projetos.**

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Bibliotecas e Dependências](#2-bibliotecas-e-dependências)
3. [Design Tokens](#3-design-tokens)
4. [Tipografia](#4-tipografia)
5. [Cores](#5-cores)
6. [Espaçamentos e Layout](#6-espaçamentos-e-layout)
7. [Estrutura de Pastas do Client](#7-estrutura-de-pastas-do-client)
8. [Arquivos de Configuração](#8-arquivos-de-configuração)
9. [Componentes de Layout](#9-componentes-de-layout)
10. [Componentes de UI](#10-componentes-de-ui)
11. [Formulários](#11-formulários)
12. [Modais e Dialogs](#12-modais-e-dialogs)
13. [Tabelas e Listas](#13-tabelas-e-listas)
14. [Feedback e Notificações](#14-feedback-e-notificações)
15. [Responsividade](#15-responsividade)
16. [Dark Mode](#16-dark-mode)
17. [Acessibilidade](#17-acessibilidade)
18. [Animações e Transições](#18-animações-e-transições)
19. [Anti-Patterns de UI](#19-anti-patterns-de-ui)

---

## 1. Visão Geral

### 1.1 Filosofia de Design

- **Consistência acima de criatividade**: Todos os sistemas do ecossistema
  devem parecer pertencer à mesma família.
- **Minimalismo funcional**: Interfaces limpas, sem excessos, focadas na
  tarefa do usuário.
- **Componentização total**: Tudo é componente reutilizável. Nunca estilize
  inline ou com CSS solto.
- **Mobile-first**: Todo layout é pensado primeiro para mobile e escala
  para desktop.
- **Acessível por padrão**: WCAG 2.1 AA como mínimo.

### 1.2 Stack de UI Obrigatória

| Camada | Tecnologia | Por quê |
|---|---|---|
| **Framework** | React 18+ / Next.js 14+ (App Router) | Padrão do ecossistema |
| **Estilização** | Tailwind CSS v3.4+ | Utility-first, consistente, performático |
| **Componentes UI** | shadcn/ui | Acessível, customizável, baseado em Radix |
| **Ícones** | Lucide React | Leve, consistente, integrado ao shadcn |
| **Formulários** | React Hook Form + Zod | Validação tipada, performático |
| **Data Fetching** | TanStack Query v5 | Cache, retry, optimistic updates |
| **Tabelas** | TanStack Table v8 | Headless, flexível, paginável |
| **Animações** | Framer Motion | Declarativo, performático |
| **Toasts** | Sonner | Leve, elegante, integrado ao shadcn |
| **Datas** | date-fns | Tree-shakeable, imutável |
| **Gráficos** | Recharts | Baseado em D3, declarativo |
| **Estado global** | Zustand | Minimalista, sem boilerplate |

---

## 2. Bibliotecas e Dependências

### 2.1 Instalação Base (todo projeto DEVE ter)

```bash
# Core
npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir

# shadcn/ui
npx shadcn-ui@latest init

# Componentes shadcn obrigatórios (instalar em todo projeto)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add breadcrumb
npx shadcn-ui@latest add pagination
npx shadcn-ui@latest add command
npx shadcn-ui@latest add form

# Dependências complementares
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query
npm install @tanstack/react-table
npm install lucide-react
npm install framer-motion
npm install sonner
npm install date-fns
npm install zustand
npm install clsx tailwind-merge
npm install class-variance-authority
```

### 2.2 Dependências Opcionais (conforme necessidade)

```bash
# Gráficos
npm install recharts

# Upload de arquivos
npm install react-dropzone

# Rich Text Editor
npm install @tiptap/react @tiptap/starter-kit

# Mapas
npm install react-leaflet leaflet

# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable
```

### 2.3 Dependências de Desenvolvimento

```bash
npm install -D @types/node
npm install -D prettier prettier-plugin-tailwindcss
npm install -D eslint-plugin-tailwindcss
```

---

## 3. Design Tokens

> **Design Tokens são a base de todo o sistema visual. São definidos como
> CSS Variables e consumidos via Tailwind. NUNCA use valores hardcoded.**

### 3.1 Arquivo de Tokens

```css
/* src/client/styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Cores de Fundo ── */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* ── Cores de Superfície ── */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* ── Cor Primária (identidade do sistema) ── */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    /* ── Cor Secundária ── */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* ── Cor Muted (textos secundários) ── */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* ── Cor de Destaque (accent) ── */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    /* ── Cor de Destruição ── */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    /* ── Cores Semânticas ── */
    --success: 142.1 76.2% 36.3%;
    --success-foreground: 355.7 100% 97.3%;
    --warning: 38 92% 50%;
    --warning-foreground: 48 96% 89%;
    --info: 199 89% 48%;
    --info-foreground: 210 40% 98%;

    /* ── Bordas e Inputs ── */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    /* ── Border Radius ── */
    --radius: 0.5rem;

    /* ── Sombras ── */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

    /* ── Header ── */
    --header-height: 4rem;
    --header-bg: 0 0% 100%;
    --header-border: 214.3 31.8% 91.4%;

    /* ── Sidebar ── */
    --sidebar-width: 16rem;
    --sidebar-collapsed-width: 4rem;
    --sidebar-bg: 222.2 84% 4.9%;
    --sidebar-foreground: 210 40% 98%;

    /* ── Footer ── */
    --footer-height: 3rem;
    --footer-bg: 210 40% 96.1%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --success: 142.1 70.6% 45.3%;
    --success-foreground: 144.9 80.4% 10%;
    --warning: 48 96% 53%;
    --warning-foreground: 38 92% 10%;
    --info: 199 89% 55%;
    --info-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --header-bg: 222.2 84% 4.9%;
    --header-border: 217.2 32.6% 17.5%;
    --sidebar-bg: 224 71% 4%;
    --sidebar-foreground: 210 40% 98%;
    --footer-bg: 217.2 32.6% 17.5%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 3.2 Tailwind Config com Tokens

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/modules/**/client/**/*.{ts,tsx}',
    './src/client/**/*.{ts,tsx}',
    './src/shared/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        header: {
          DEFAULT: 'hsl(var(--header-bg))',
          border: 'hsl(var(--header-border))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-bg))',
          foreground: 'hsl(var(--sidebar-foreground))',
        },
        footer: {
          DEFAULT: 'hsl(var(--footer-bg))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      height: {
        header: 'var(--header-height)',
        footer: 'var(--footer-height)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      spacing: {
        header: 'var(--header-height)',
        sidebar: 'var(--sidebar-width)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        'card': 'var(--shadow-md)',
        'card-hover': 'var(--shadow-lg)',
        'modal': 'var(--shadow-xl)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## 4. Tipografia

### 4.1 Famílias de Fonte

```typescript
// src/client/config/fonts.config.ts
import { Inter, JetBrains_Mono } from 'next/font/google';

export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

### 4.2 Escala Tipográfica

| Nível | Classe Tailwind | Tamanho | Uso |
|---|---|---|---|
| **Display** | `text-4xl font-bold tracking-tight` | 36px | Hero sections, landing pages |
| **H1** | `text-3xl font-bold tracking-tight` | 30px | Título principal da página |
| **H2** | `text-2xl font-semibold tracking-tight` | 24px | Seções principais |
| **H3** | `text-xl font-semibold` | 20px | Subseções |
| **H4** | `text-lg font-medium` | 18px | Cards, grupos |
| **Body** | `text-base font-normal` | 16px | Texto corrido |
| **Body Small** | `text-sm font-normal` | 14px | Textos secundários |
| **Caption** | `text-xs font-medium` | 12px | Labels, badges, timestamps |
| **Overline** | `text-xs font-semibold uppercase tracking-wider` | 12px | Categorias, tags |

### 4.3 Componente de Título Padronizado

```tsx
// src/client/ui/typography/page-title.component.tsx
import { cn } from '@/shared/utils/cn.util';

interface PageTitleProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageTitle({
  title,
  description,
  actions,
  className,
}: PageTitleProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
```

### 4.4 Componente de Título de Seção

```tsx
// src/client/ui/typography/section-title.component.tsx
import { cn } from '@/shared/utils/cn.util';

interface SectionTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionTitle({
  title,
  description,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

## 5. Cores

### 5.1 Paleta Semântica

| Cor | Token | Uso |
|---|---|---|
| **Primary** | `--primary` | Ações principais, links, CTAs |
| **Secondary** | `--secondary` | Ações secundárias, fundos sutis |
| **Destructive** | `--destructive` | Exclusão, erros, perigo |
| **Success** | `--success` | Confirmação, sucesso, ativo |
| **Warning** | `--warning` | Atenção, pendente, cautela |
| **Info** | `--info` | Informação, ajuda, neutro |
| **Muted** | `--muted` | Textos secundários, backgrounds |

### 5.2 Regras de Uso de Cores

1. **NUNCA use cores hardcoded** (`#3B82F6`, `rgb(59,130,246)`).
   Sempre use tokens (`text-primary`, `bg-destructive`).
2. **Primary é a cor de identidade** do sistema. Cada sistema pode ter
   um `--primary` diferente, mas a estrutura é a mesma.
3. **Destructive é sempre vermelho**. Não use para nada além de ações
   destrutivas.
4. **Success é sempre verde**. Use para confirmações e estados ativos.
5. **Backgrounds de cards** usam `bg-card`, não `bg-white`.
6. **Textos secundários** usam `text-muted-foreground`, não `text-gray-500`.

### 5.3 Customização por Sistema

Cada sistema pode customizar a cor primária alterando **apenas** o token
`--primary` no `globals.css`:

```css
/* Exemplo: Sistema Financeiro (verde) */
:root {
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
}

/* Exemplo: Sistema de Saúde (azul claro) */
:root {
  --primary: 199 89% 48%;
  --primary-foreground: 210 40% 98%;
}

/* Exemplo: Sistema de RH (roxo) */
:root {
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 40% 98%;
}
```

---

## 6. Espaçamentos e Layout

### 6.1 Grid Base

```
Container máximo: 1400px (2xl)
Padding lateral: 2rem (desktop), 1rem (mobile)
Gap padrão entre seções: 2rem (gap-8)
Gap padrão entre cards: 1.5rem (gap-6)
Gap padrão entre elementos: 1rem (gap-4)
```

### 6.2 Layout Padrão da Aplicação

```
┌──────────────────────────────────────────────────┐
│  HEADER (h-16, fixed, z-50)                      │
├────────┬─────────────────────────────────────────┤
│        │                                         │
│  SIDE  │  MAIN CONTENT                           │
│  BAR   │  (p-6, max-w-7xl, mx-auto)              │
│ (w-64) │                                         │
│        │  ┌─ Page Title ──────────────────────┐   │
│  Nav   │  │  Título + Descrição + Ações       │   │
│  Items │  └───────────────────────────────────┘   │
│        │                                         │
│        │  ┌─ Content Area ────────────────────┐   │
│        │  │                                   │   │
│        │  │  Cards / Tables / Forms            │   │
│        │  │                                   │   │
│        │  └───────────────────────────────────┘   │
│        │                                         │
├────────┴─────────────────────────────────────────┤
│  FOOTER (h-12, text-center, text-sm)              │
└──────────────────────────────────────────────────┘
```

### 6.3 Componente de Layout Principal

```tsx
// src/client/ui/layout/app-layout.component.tsx
import { Header } from './header.component';
import { Sidebar } from './sidebar.component';
import { Footer } from './footer.component';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  user: UserSession;
}

export function AppLayout({ children, sidebarItems, user }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <div className="flex flex-1 pt-header">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-6">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

---

## 7. Estrutura de Pastas do Client

```
src/client/
│
├── styles/
│   └── globals.css                 # Design tokens + Tailwind directives
│
├── config/
│   ├── fonts.config.ts             # Configuração de fontes (next/font)
│   ├── theme.config.ts             # Configuração do tema (cores do sistema)
│   └── layout.config.ts            # Configuração do layout (sidebar, header)
│
├── ui/                             # Componentes de UI genéricos (reutilizáveis)
│   ├── layout/
│   │   ├── app-layout.component.tsx
│   │   ├── header.component.tsx
│   │   ├── sidebar.component.tsx
│   │   ├── sidebar-item.component.tsx
│   │   ├── footer.component.tsx
│   │   └── page-container.component.tsx
│   ├── typography/
│   │   ├── page-title.component.tsx
│   │   ├── section-title.component.tsx
│   │   └── empty-state.component.tsx
│   ├── feedback/
│   │   ├── loading-screen.component.tsx
│   │   ├── loading-skeleton.component.tsx
│   │   ├── error-boundary.component.tsx
│   │   └── error-fallback.component.tsx
│   ├── data-display/
│   │   ├── data-table.component.tsx
│   │   ├── data-table-pagination.component.tsx
│   │   ├── data-table-toolbar.component.tsx
│   │   ├── stat-card.component.tsx
│   │   └── info-card.component.tsx
│   ├── forms/
│   │   ├── form-field.component.tsx
│   │   ├── form-actions.component.tsx
│   │   ├── search-input.component.tsx
│   │   └── confirm-dialog.component.tsx
│   └── navigation/
│       ├── breadcrumb-nav.component.tsx
│       ├── tab-nav.component.tsx
│       └── pagination-nav.component.tsx
│
├── providers/
│   ├── theme-provider.component.tsx
│   ├── query-provider.component.tsx
│   ├── toast-provider.component.tsx
│   └── auth-provider.component.tsx
│
└── hooks/
    ├── use-media-query.hook.ts
    ├── use-debounce.hook.ts
    └── use-sidebar.hook.ts
```

---

## 8. Arquivos de Configuração

### 8.1 Configuração de Fontes

```typescript
// src/client/config/fonts.config.ts
import { Inter, JetBrains_Mono } from 'next/font/google';

export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

### 8.2 Configuração do Tema

```typescript
// src/client/config/theme.config.ts

export const themeConfig = {
  // Nome do sistema (aparece no header e footer)
  name: 'Nome do Sistema',

  // Logo (caminho relativo à pasta public)
  logo: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
    icon: '/logo-icon.svg',
  },

  // Cor primária do sistema (sobrescreve o token CSS)
  // HSL sem o hsl() wrapper
  primaryColor: '221.2 83.2% 53.3%',

  // Favicon
  favicon: '/favicon.ico',

  // Meta tags padrão
  meta: {
    title: 'Nome do Sistema',
    description: 'Descrição do sistema',
    keywords: ['sistema', 'gestão'],
  },
} as const;
```

### 8.3 Configuração do Layout

```typescript
// src/client/config/layout.config.ts
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: SidebarItem[];
  badge?: string;
  requiresPermission?: string;
}

export const layoutConfig = {
  header: {
    height: '4rem',
    showLogo: true,
    showSearch: true,
    showNotifications: true,
    showUserMenu: true,
  },
  sidebar: {
    width: '16rem',
    collapsedWidth: '4rem',
    collapsible: true,
    defaultCollapsed: false,
  },
  footer: {
    show: true,
    showVersion: true,
    showCopyright: true,
  },
} as const;

// Cada sistema define seus próprios itens de sidebar
export const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Usuários',
    href: '/users',
    icon: Users,
    requiresPermission: 'users:read',
  },
  {
    label: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Documentos',
    href: '/documents',
    icon: FileText,
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
];
```

### 8.4 Providers Globais

```tsx
// src/client/providers/app-providers.component.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useState } from 'react';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'font-sans',
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 8.5 Root Layout (Next.js App Router)

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { cn } from '@/shared/utils/cn.util';
import { fontSans, fontMono } from '@/client/config/fonts.config';
import { themeConfig } from '@/client/config/theme.config';
import { AppProviders } from '@/client/providers/app-providers.component';
import '@/client/styles/globals.css';

export const metadata: Metadata = {
  title: themeConfig.meta.title,
  description: themeConfig.meta.description,
  keywords: themeConfig.meta.keywords,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
```

---

## 9. Componentes de Layout

### 9.1 Header

```tsx
// src/client/ui/layout/header.component.tsx
'use client';

import { Bell, Search, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { themeConfig } from '@/client/config/theme.config';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onToggleSidebar?: () => void;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  const { setTheme, theme } = useTheme();

  return (
    <header className="fixed top-0 z-50 flex h-header w-full items-center justify-between border-b border-header-border bg-header px-4">
      {/* Esquerda: Logo + Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img
            src={theme === 'dark' ? themeConfig.logo.dark : themeConfig.logo.light}
            alt={themeConfig.name}
            className="h-8 w-auto"
          />
          <span className="hidden text-lg font-semibold sm:block">
            {themeConfig.name}
          </span>
        </div>
      </div>

      {/* Direita: Ações */}
      <div className="flex items-center gap-2">
        {/* Busca */}
        <Button variant="ghost" size="icon">
          <Search className="h-4 w-4" />
        </Button>

        {/* Tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Menu do Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### 9.2 Sidebar

```tsx
// src/client/ui/layout/sidebar.component.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn.util';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SidebarItem } from '@/client/config/layout.config';

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ items, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-header z-40 hidden h-[calc(100vh-var(--header-height))] flex-col border-r bg-card transition-all duration-300 lg:flex',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      {/* Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      {/* Toggle */}
      {onToggle && (
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}
```

### 9.3 Footer

```tsx
// src/client/ui/layout/footer.component.tsx
import { themeConfig } from '@/client/config/theme.config';
import { layoutConfig } from '@/client/config/layout.config';

export function Footer() {
  if (!layoutConfig.footer.show) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="flex h-footer items-center justify-center border-t bg-footer px-4">
      <p className="text-xs text-muted-foreground">
        {layoutConfig.footer.showCopyright && `© ${year} ${themeConfig.name}.`}
        {layoutConfig.footer.showVersion && (
          <span className="ml-2 text-muted-foreground/60">v1.0.0</span>
        )}
      </p>
    </footer>
  );
}
```

### 9.4 Page Container

```tsx
// src/client/ui/layout/page-container.component.tsx
import { cn } from '@/shared/utils/cn.util';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  className,
  maxWidth = '2xl',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 lg:px-8',
        maxWidthMap[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}
```

---

## 10. Componentes de UI

### 10.1 Stat Card (Cards de Métricas)

```tsx
// src/client/ui/data-display/stat-card.component.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/shared/utils/cn.util';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('transition-shadow hover:shadow-card-hover', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  'font-medium',
                  trend.direction === 'up' ? 'text-success' : 'text-destructive',
                )}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
            {description && <span className="ml-1">{description}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 10.2 Empty State

```tsx
// src/client/ui/typography/empty-state.component.tsx
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="mb-4 text-muted-foreground">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### 10.3 Loading Skeleton

```tsx
// src/client/ui/feedback/loading-skeleton.component.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  type: 'table' | 'cards' | 'form' | 'detail';
  count?: number;
}

export function LoadingSkeleton({ type, count = 3 }: LoadingSkeletonProps) {
  if (type === 'cards') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
```

---

## 11. Formulários

### 11.1 Padrão de Formulário com React Hook Form + Zod

```tsx
// src/modules/user/client/ui/forms/create-user.form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Schema de validação (pode reutilizar regras do domínio!)
const createUserSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('Formato de email inválido')
    .max(255, 'Email muito longo'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateUserForm({ onSubmit, isLoading }: CreateUserFormProps) {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: CreateUserFormData) => {
    try {
      await onSubmit(data);
      toast.success('Usuário criado com sucesso');
      form.reset();
    } catch (error) {
      toast.error('Erro ao criar usuário');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Usuário</CardTitle>
        <CardDescription>
          Preencha os dados para criar um novo usuário no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Usuário'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Limpar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 11.2 Regras de Formulários

1. **Sempre use React Hook Form + Zod**. Nunca `useState` individual para
   cada campo.
2. **Validação no client espelha o domínio**: As regras do Zod devem
   refletir as regras dos Value Objects do domínio.
3. **Mensagens de erro em português**: O usuário final é brasileiro.
4. **Labels obrigatórios em todos os campos**: Nunca placeholders como
   substituto de label.
5. **Feedback de loading no botão de submit**: Desabilite o botão e
   mostre texto de loading.
6. **Toast de sucesso/erro**: Sempre notifique o resultado da ação.
7. **Reset após sucesso**: Limpe o formulário após criação bem-sucedida.

---

## 12. Modais e Dialogs

### 12.1 Dialog de Confirmação

```tsx
// src/client/ui/forms/confirm-dialog.component.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 12.2 Regras de Modais

1. **Modais de confirmação** para toda ação destrutiva (excluir, desativar).
2. **Modais de formulário** apenas para criações rápidas. Para formulários
   complexos, use uma página dedicada.
3. **Título + Descrição** obrigatórios em todo modal.
4. **Botão de cancelar** sempre visível e como primeira opção.
5. **Botão de confirmar** com cor `destructive` para ações perigosas.
6. **Fechar ao clicar fora** apenas para modais não-destrutivos.
7. **Loading state** no botão de confirmar durante operações assíncronas.
8. **Nunca aninhe modais** (modal dentro de modal).

---

## 13. Tabelas e Listas

### 13.1 Data Table Genérico

```tsx
// src/client/ui/data-display/data-table.component.tsx
'use client';

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from './data-table-pagination.component';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Buscar...',
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
            }
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        )}
        {toolbar}
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <DataTablePagination table={table} />
    </div>
  );
}
```

### 13.2 Regras de Tabelas

1. **Sempre use TanStack Table** para tabelas com dados dinâmicos.
2. **Paginação obrigatória** para listas com mais de 10 itens.
3. **Busca/filtro** no topo da tabela quando aplicável.
4. **Estado vazio** com mensagem clara quando não há dados.
5. **Loading skeleton** enquanto os dados carregam.
6. **Coluna de ações** sempre à direita, com ícones em DropdownMenu.
7. **Ordenação** nas colunas relevantes (nome, data, status).
8. **Responsiva**: Em mobile, considere usar Cards ao invés de tabela.

---

## 14. Feedback e Notificações

### 14.1 Padrão de Toasts (Sonner)

```typescript
// Uso padrão em todo o ecossistema
import { toast } from 'sonner';

// Sucesso
toast.success('Operação realizada com sucesso');

// Erro
toast.error('Erro ao processar a solicitação');

// Info
toast.info('Novas atualizações disponíveis');

// Warning
toast.warning('Sua sessão expira em 5 minutos');

// Loading (para operações longas)
const toastId = toast.loading('Processando...');
// ... após completar:
toast.success('Concluído!', { id: toastId });
```

### 14.2 Regras de Feedback

| Ação | Tipo de Feedback | Quando |
|---|---|---|
| Criar registro | `toast.success` | Após confirmação do server |
| Atualizar registro | `toast.success` | Após confirmação do server |
| Excluir registro | `toast.success` | Após confirmação do server |
| Erro de validação | `FormMessage` (inline) | Instantâneo no campo |
| Erro de servidor | `toast.error` | Após resposta do server |
| Erro de rede | `toast.error` | Quando a request falhar |
| Operação longa | `toast.loading` → `success/error` | Durante a operação |
| Confirmação destrutiva | `ConfirmDialog` | Antes da ação |
| Info/aviso | `toast.info` ou `toast.warning` | Quando relevante |

---

## 15. Responsividade

### 15.1 Breakpoints

| Breakpoint | Largura | Uso |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeno (sidebar aparece) |
| `xl` | 1280px | Desktop padrão |
| `2xl` | 1400px | Desktop grande (container máximo) |

### 15.2 Regras de Responsividade

1. **Mobile-first**: Escreva CSS para mobile primeiro, use `sm:`, `md:`,
   `lg:` para escalar.
2. **Sidebar**: Oculta em mobile (usa Sheet/Drawer), visível em `lg+`.
3. **Header**: Sempre visível, adapta conteúdo (esconde busca em mobile).
4. **Tabelas**: Em mobile, transforme em Cards ou use scroll horizontal.
5. **Formulários**: 1 coluna em mobile, 2 colunas em `md+`.
6. **Grid de cards**: 1 col mobile → 2 col `sm` → 3 col `lg` → 4 col `xl`.
7. **Touch targets**: Mínimo 44x44px para botões em mobile.

### 15.3 Grid de Cards Responsivo

```tsx
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

---

## 16. Dark Mode

### 16.1 Configuração

```tsx
// Dark mode é gerenciado pelo next-themes
// O toggle está no Header (botão Sol/Lua)
// Os tokens CSS já possuem variantes .dark no globals.css
```

### 16.2 Regras de Dark Mode

1. **Todo projeto DEVE suportar dark mode**. Não é opcional.
2. **Use tokens CSS** (`bg-card`, `text-foreground`) ao invés de cores
   fixas (`bg-white`, `text-black`).
3. **Imagens e logos** devem ter versões para light e dark.
4. **Sombras** devem ser mais sutis no dark mode.
5. **Bordas** devem ser mais escuras no dark mode.
6. **Teste ambos os temas** antes de considerar uma tela pronta.
7. **Respeite a preferência do sistema** (`defaultTheme="system"`).

---

## 17. Acessibilidade

### 17.1 Regras Mínimas (WCAG 2.1 AA)

1. **Contraste**: Mínimo 4.5:1 para texto normal, 3:1 para texto grande.
2. **Focus visible**: Todo elemento interativo deve ter `focus-visible:ring`.
3. **Alt text**: Toda imagem deve ter `alt` descritivo.
4. **Labels**: Todo input deve ter `<label>` associado.
5. **Keyboard navigation**: Toda funcionalidade acessível via teclado.
6. **ARIA**: Use atributos ARIA quando o HTML semântico não for suficiente.
7. **Screen reader**: Teste com leitor de tela pelo menos nas telas críticas.
8. **shadcn/ui já é acessível**: Os componentes do Radix já vêm com ARIA
   correto. Não remova esses atributos.

---

## 18. Animações e Transições

### 18.1 Padrões de Animação

| Elemento | Animação | Duração |
|---|---|---|
| Page transition | `fade-in` | 300ms |
| Modal/Dialog | `scale-in` + `fade-in` | 200ms |
| Dropdown/Popover | `fade-in` + `slide-down` | 150ms |
| Toast | `slide-in-right` | 300ms |
| Sidebar | `width` transition | 300ms |
| Hover em cards | `shadow` transition | 200ms |
| Skeleton loading | `pulse` | 2000ms (loop) |

### 18.2 Regras de Animação

1. **Sutil e funcional**: Animações devem melhorar a UX, não distrair.
2. **Máximo 300ms** para transições de UI.
3. **Respeite `prefers-reduced-motion`**: Desabilite animações para
   usuários que preferem movimento reduzido.
4. **Use Framer Motion** para animações complexas (page transitions,
   listas animadas).
5. **Use CSS transitions** para animações simples (hover, focus).

```tsx
// Respeitar prefers-reduced-motion
// tailwind.config.ts
// motion-safe:animate-fade-in (só anima se o usuário permitir)
```

---

## 19. Anti-Patterns de UI

> **Lista do que NUNCA fazer em interfaces.**

| # | Anti-Pattern | O que fazer |
|---|---|---|
| 1 | **Cores hardcoded** (`bg-[#3B82F6]`) | Use tokens (`bg-primary`) |
| 2 | **Estilos inline** (`style={{ color: 'red' }}`) | Use classes Tailwind |
| 3 | **CSS customizado fora do globals.css** | Use tokens e utilitários |
| 4 | **Componentes UI duplicados** entre módulos | Use `src/client/ui/` |
| 5 | **Formulários com useState por campo** | Use React Hook Form |
| 6 | **Fetch direto no useEffect** | Use TanStack Query |
| 7 | **Alert nativo** (`alert('Erro')`) | Use Sonner toast |
| 8 | **Confirm nativo** (`confirm('Excluir?')`) | Use ConfirmDialog |
| 9 | **T