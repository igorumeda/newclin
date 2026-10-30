'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Inbox,
  LogIn,
  Menu,
  Moon,
  SearchX,
  Sun,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { SearchInput } from '@/client/ui/search-input';
import { cn } from '@/shared/utils/cn.util';
import type { ImagensPublicasSistema } from '@/shared/utils/public-images.util';
import {
  CATEGORIAS_RECURSOS,
  RECURSOS_LANDING,
  type CategoriaRecursoLanding,
  type RecursoLanding,
} from './landing-dados';
import {
  LandingHero,
  type NavegarSecaoHandler,
  type SecaoLandingId,
} from './landing-hero';
import { LandingVitrineClinica } from './landing-vitrine-clinica';

export type LandingPageProps = {
  imagens: ImagensPublicasSistema;
};

type FiltrarRecursosParams = {
  recursos: RecursoLanding[];
  busca: string;
  categoria: CategoriaRecursoLanding;
};

type LinkNavegacaoLanding = {
  id: SecaoLandingId;
  href: `#${SecaoLandingId}`;
  rotulo: string;
};

const LINKS_NAVEGACAO: readonly LinkNavegacaoLanding[] = [
  { id: 'inicio', href: '#inicio', rotulo: 'Início' },
  { id: 'recursos', href: '#recursos', rotulo: 'Recursos' },
  { id: 'economia', href: '#economia', rotulo: 'Economia' },
  { id: 'vantagens', href: '#vantagens', rotulo: 'Vantagens' },
];

function filtrarRecursos({
  recursos,
  busca,
  categoria,
}: FiltrarRecursosParams): RecursoLanding[] {
  const termo = busca.trim().toLowerCase();
  return recursos.filter((item) => {
    const bateCategoria = categoria === 'todos' || item.categoria === categoria;
    if (!bateCategoria) return false;
    if (!termo) return true;
    const alvo = [item.titulo, item.descricao, item.beneficio, item.tag]
      .join(' ')
      .toLowerCase();
    return alvo.includes(termo);
  });
}

export function LandingPage({ imagens }: LandingPageProps) {
  const { theme, setTheme } = useTheme();
  const [busca, setBusca] = React.useState('');
  const [categoria, setCategoria] =
    React.useState<CategoriaRecursoLanding>('todos');
  const [menuMobileAberto, setMenuMobileAberto] = React.useState(false);
  const [secaoAtiva, setSecaoAtiva] = React.useState<SecaoLandingId>('inicio');
  const rolagemProgramaticaAteRef = React.useRef<number>(0);

  const navegarParaSecao: NavegarSecaoHandler = React.useCallback(
    ({ evento, secao }) => {
      evento.preventDefault();
      setSecaoAtiva(secao);
      setMenuMobileAberto(false);

      const elemento = document.getElementById(secao);
      if (!elemento) return;

      const prefereMovimentoReduzido = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      rolagemProgramaticaAteRef.current = Date.now() + 750;

      elemento.scrollIntoView({
        behavior: prefereMovimentoReduzido ? 'auto' : 'smooth',
        block: 'start',
      });

      window.history.replaceState(null, '', `#${secao}`);
    },
    [],
  );

  React.useEffect(() => {
    const atualizarSecaoPorScroll = () => {
      if (Date.now() < rolagemProgramaticaAteRef.current) return;

      const limiteTopo = 140;
      let candidata: SecaoLandingId = 'inicio';

      for (const item of LINKS_NAVEGACAO) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= limiteTopo) {
          candidata = item.id;
        }
      }

      setSecaoAtiva((atual) => (atual === candidata ? atual : candidata));
    };

    window.addEventListener('scroll', atualizarSecaoPorScroll, {
      passive: true,
    });
    return () => window.removeEventListener('scroll', atualizarSecaoPorScroll);
  }, []);

  const recursosFiltrados = React.useMemo(
    () => filtrarRecursos({ recursos: RECURSOS_LANDING, busca, categoria }),
    [busca, categoria],
  );

  const logoHeader = imagens.logotipo.miniTransparente;
  const anoAtual = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Cabeçalho enxuto inspirado no modelo */}
      <header className="sticky top-0 z-50 border-b border-header-border bg-header/95 backdrop-blur-md">
        <div className="mx-auto flex h-header max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
          <a
            href="#inicio"
            aria-label="NewClin — Início"
            onClick={(evento) =>
              navegarParaSecao({ evento, secao: 'inicio' })
            }
            className="inline-flex min-w-0 shrink items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/95 dark:px-2.5 dark:py-1"
          >
            {logoHeader ? (
              <img
                src={logoHeader}
                alt="NewClin — Sua clínica no digital"
                className="h-7 w-auto object-contain sm:h-10"
              />
            ) : (
              <span className="text-base font-bold tracking-tight text-primary sm:text-lg">
                NewClin
              </span>
            )}
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-6 lg:flex"
          >
            {LINKS_NAVEGACAO.map((link) => {
              const ativo = secaoAtiva === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  aria-current={ativo ? 'location' : undefined}
                  onClick={(evento) =>
                    navegarParaSecao({ evento, secao: link.id })
                  }
                  className={cn(
                    'border-b-2 py-1 text-sm font-medium transition-all duration-fast hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    ativo
                      ? 'border-primary font-semibold text-primary'
                      : 'border-transparent text-muted-foreground',
                  )}
                >
                  {link.rotulo}
                </a>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Alternar tema claro ou escuro"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun
                aria-hidden="true"
                className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              />
              <Moon
                aria-hidden="true"
                className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              />
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-full px-3.5 sm:h-11 sm:px-5"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Entrar</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={menuMobileAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuMobileAberto}
              onClick={() => setMenuMobileAberto((aberto) => !aberto)}
            >
              {menuMobileAberto ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {menuMobileAberto ? (
          <nav
            aria-label="Menu mobile"
            className="border-t bg-card px-4 py-3 lg:hidden"
          >
            <div className="flex flex-col space-y-1">
              {LINKS_NAVEGACAO.map((link) => {
                const ativo = secaoAtiva === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    aria-current={ativo ? 'location' : undefined}
                    onClick={(evento) =>
                      navegarParaSecao({ evento, secao: link.id })
                    }
                    className={cn(
                      'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                      ativo
                        ? 'bg-accent/60 font-semibold text-primary underline decoration-primary decoration-2 underline-offset-4'
                        : 'text-foreground',
                    )}
                  >
                    {link.rotulo}
                  </a>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="min-w-0 flex-1">
        {/* Hero enxuto e focado em conversão */}
        <LandingHero imagens={imagens} aoNavegarSecao={navegarParaSecao} />

        {/* Seção resumida do que o sistema oferece */}
        <section
          id="recursos"
          aria-labelledby="recursos-heading"
          className="mx-auto max-w-7xl scroll-mt-20 space-y-6 px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <Badge variant="secondary" className="px-3 py-1 text-xs">
                Tudo em um só lugar
              </Badge>
              <h2
                id="recursos-heading"
                className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                O que a NewClin faz pela sua clínica
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Sem menus complicados: apenas o que você realmente usa para atender
              melhor e crescer.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              label="Buscar recurso"
              placeholder="Buscar (ex: WhatsApp, agenda, receita)..."
              value={busca}
              onValueChange={setBusca}
              className="lg:max-w-xs"
            />

            <div
              role="group"
              aria-label="Filtrar por área"
              className="flex min-w-0 flex-wrap items-center gap-2"
            >
              {CATEGORIAS_RECURSOS.map((item) => {
                const selecionada = categoria === item.id;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={selecionada ? 'default' : 'outline'}
                    onClick={() => setCategoria(item.id)}
                    className="h-[var(--control-height)] rounded-full px-4 text-xs sm:text-sm"
                  >
                    {item.rotulo}
                  </Button>
                );
              })}
            </div>
          </div>

          {recursosFiltrados.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recursosFiltrados.map((recurso) => {
                const Icone = recurso.icone;
                return (
                  <Card
                    key={recurso.id}
                    className="flex min-w-0 flex-col justify-between transition-shadow hover:shadow-card-hover"
                  >
                    <CardHeader className="space-y-3 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-info/20 to-primary/20 text-primary">
                          <Icone className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {recurso.tag}
                        </Badge>
                      </div>
                      <CardTitle className="text-base sm:text-lg">
                        {recurso.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {recurso.descricao}
                      </p>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span>{recurso.beneficio}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center">
              <SearchX
                className="mb-3 h-10 w-10 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold">Nenhum item encontrado</h3>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setBusca('');
                  setCategoria('todos');
                }}
              >
                <Inbox className="h-4 w-4" aria-hidden="true" />
                Ver tudo
              </Button>
            </div>
          )}
        </section>

        {/* Economia Estimada + Vitrine Visual Enxuta + CTA */}
        <LandingVitrineClinica imagens={imagens} />
      </main>

      <footer className="border-t bg-footer py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logoHeader ? (
              <div className="inline-flex rounded-lg dark:bg-white/95 dark:px-2.5 dark:py-1">
                <img
                  src={logoHeader}
                  alt="NewClin"
                  className="h-6 w-auto object-contain"
                />
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              © {anoAtual} NewClin — Sua clínica no digital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <a
              href="#recursos"
              onClick={(evento) =>
                navegarParaSecao({ evento, secao: 'recursos' })
              }
              className="hover:text-foreground"
            >
              Recursos
            </a>
            <a
              href="#economia"
              onClick={(evento) =>
                navegarParaSecao({ evento, secao: 'economia' })
              }
              className="hover:text-foreground"
            >
              Economia
            </a>
            <a
              href="#vantagens"
              onClick={(evento) =>
                navegarParaSecao({ evento, secao: 'vantagens' })
              }
              className="hover:text-foreground"
            >
              Vantagens
            </a>
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Entrar na plataforma
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
