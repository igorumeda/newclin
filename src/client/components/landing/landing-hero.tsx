'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, Stethoscope } from 'lucide-react';
import { Button } from '@/client/ui/button';
import type { ImagensPublicasSistema } from '@/shared/utils/public-images.util';
import { PILARES_HERO } from './landing-dados';

export type SecaoLandingId = 'inicio' | 'recursos' | 'economia' | 'vantagens';
export type NavegarSecaoHandler = (params: {
  evento: MouseEvent<HTMLAnchorElement>;
  secao: SecaoLandingId;
}) => void;

export type LandingHeroProps = {
  imagens: ImagensPublicasSistema;
  aoNavegarSecao: NavegarSecaoHandler;
};

function CircuitoDecorativo() {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 420 320"
        className="pointer-events-none absolute -bottom-8 -left-8 h-64 w-80 text-primary/10 dark:text-info/15"
        fill="none"
      >
        <path
          d="M10 290 L110 190 L210 190 L280 120 M40 310 L140 210 L250 210 L330 130 M0 240 L80 160 L165 160 L225 100"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="280" cy="120" r="5" fill="currentColor" />
        <circle cx="330" cy="130" r="5" fill="currentColor" />
        <circle cx="225" cy="100" r="5" fill="currentColor" />
        <circle cx="110" cy="190" r="4" fill="currentColor" />
        <circle cx="140" cy="210" r="4" fill="currentColor" />
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 420 320"
        className="pointer-events-none absolute -right-6 -top-6 h-72 w-96 text-info/15 dark:text-info/20"
        fill="none"
      >
        <path
          d="M410 30 L300 140 L200 140 L130 210 M380 10 L270 120 L170 120 L90 200 M420 80 L330 170 L240 170 L180 230"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="130" cy="210" r="5" fill="currentColor" />
        <circle cx="90" cy="200" r="5" fill="currentColor" />
        <circle cx="180" cy="230" r="5" fill="currentColor" />
        <circle cx="300" cy="140" r="4" fill="currentColor" />
        <circle cx="270" cy="120" r="4" fill="currentColor" />
      </svg>
    </>
  );
}

export function LandingHero({ imagens, aoNavegarSecao }: LandingHeroProps) {
  const fotoHero = imagens.business.medicaTablet;
  const iconeLogo = imagens.logotipo.miniIconeTransparente;

  return (
    <section
      id="inicio"
      aria-labelledby="hero-heading"
      className="relative isolate scroll-mt-20 overflow-hidden border-b bg-gradient-to-br from-background via-muted/40 to-accent/30 py-10 sm:py-16 lg:py-20"
    >
      <CircuitoDecorativo />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Coluna Esquerda: Copy enxuto e focado em resultado */}
          <div className="relative z-10 flex min-w-0 flex-col items-start space-y-6 lg:col-span-7">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/25 bg-card/90 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm">
              {iconeLogo ? (
                <img
                  src={iconeLogo}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 object-contain sm:h-5 sm:w-5"
                />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0 text-info" aria-hidden="true" />
              )}
              <span>MAIS PACIENTES ATENDIDOS · MENOS CUSTO OPERACIONAL</span>
            </div>

            <div className="min-w-0 space-y-2">
              <h1
                id="hero-heading"
                className="break-words text-3xl font-extrabold uppercase tracking-tight sm:text-5xl lg:text-6xl"
              >
                <span className="bg-gradient-to-r from-info via-primary to-sidebar bg-clip-text text-transparent dark:from-info dark:via-primary dark:to-foreground">
                  NEWCLIN
                </span>
              </h1>
              <p className="text-xl font-normal tracking-tight text-primary sm:text-3xl lg:text-4xl">
                Sua clínica no digital
              </p>
            </div>

            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Abandone as planilhas e coloque sua recepção, agenda e prontuários no
              piloto automático. Reduza faltas em até 40% e economize horas de
              trabalho da sua equipe todos os dias.
            </p>

            <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gradient-to-r from-info to-primary px-8 font-semibold tracking-wide text-primary-foreground shadow-card transition-all hover:opacity-95 hover:shadow-card-hover"
              >
                <Link href="/login">
                  Começar Agora
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-primary/30 bg-card/80 px-7 font-medium hover:bg-accent"
              >
                <a
                  href="#economia"
                  onClick={(evento) =>
                    aoNavegarSecao({ evento, secao: 'economia' })
                  }
                >
                  Ver Quanto Você Economiza
                </a>
              </Button>
            </div>

            {/* 3 pilares rápidos na base */}
            <div className="grid w-full grid-cols-1 gap-3 border-t border-border/70 pt-6 sm:grid-cols-3">
              {PILARES_HERO.map((pilar) => {
                const Icone = pilar.icone;
                return (
                  <div
                    key={pilar.rotulo}
                    className="flex min-w-0 items-center gap-2.5 text-xs font-medium text-muted-foreground sm:text-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate text-foreground/90">{pilar.rotulo}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Visual inspirado no modelo */}
          <div className="relative z-10 flex min-w-0 items-center justify-center lg:col-span-5">
            <div className="relative mx-auto w-full max-w-md">
              <div
                aria-hidden="true"
                className="absolute -bottom-4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-tr from-sidebar via-primary to-info opacity-90 blur-[1px] sm:h-80 sm:w-80"
              />
              <div
                aria-hidden="true"
                className="absolute -right-3 bottom-8 hidden h-28 w-48 rotate-12 rounded-3xl bg-gradient-to-r from-info/80 to-primary/90 shadow-card sm:block"
              />

              <div className="relative mx-auto overflow-hidden rounded-3xl border-2 border-card/80 bg-gradient-to-b from-card/60 to-primary/20 shadow-modal backdrop-blur-sm">
                {fotoHero ? (
                  <img
                    src={fotoHero}
                    alt="Médica utilizando tablet com prontuário digital NewClin"
                    className="h-[340px] w-full object-cover object-top sm:h-[420px]"
                  />
                ) : (
                  <div className="flex h-[340px] w-full items-center justify-center bg-muted">
                    <Stethoscope
                      className="h-16 w-16 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sidebar/80 to-transparent"
                />
              </div>

              {/* Selo lateral de impacto (inspirado no badge lateral do modelo) */}
              <div className="absolute right-2 top-6 z-20 flex flex-col items-center justify-center rounded-3xl border border-primary-foreground/20 bg-gradient-to-br from-info via-primary to-sidebar px-4 py-3 text-center text-primary-foreground shadow-modal sm:-right-4 sm:top-8 sm:px-6 sm:py-5">
                <span className="text-xl font-extrabold leading-none sm:text-2xl">
                  -40%
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-95 sm:text-xs">
                  Faltas
                </span>
                <span className="mt-0.5 text-[10px] opacity-85 sm:text-[11px]">
                  +Lucro Mensal
                </span>
              </div>

              {/* Card inferior resumido de economia */}
              <div className="absolute -bottom-4 left-2 right-2 z-20 flex items-center justify-between gap-2.5 rounded-2xl border bg-card/95 p-3 shadow-card backdrop-blur-md sm:left-4 sm:right-6 sm:p-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success sm:h-10 sm:w-10">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                      Economia média de R$ 4.500/mês
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Em tempo de equipe, papel e consultas recuperadas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
