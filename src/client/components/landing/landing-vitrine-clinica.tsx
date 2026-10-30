'use client';

import Link from 'next/link';
import { ArrowRight, Palette, ShieldCheck } from 'lucide-react';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import type { ImagensPublicasSistema } from '@/shared/utils/public-images.util';
import { INDICADORES_ECONOMIA } from './landing-dados';

export type LandingVitrineClinicaProps = {
  imagens: ImagensPublicasSistema;
};

export function LandingVitrineClinica({ imagens }: LandingVitrineClinicaProps) {
  const {
    medicaPrancheta,
    medicoConsultorio,
    medicoJovem,
    medicoSenior,
    loginBackground,
  } = imagens.business;
  const { miniAzul, miniBranco, miniIconeTransparente } = imagens.logotipo;

  const vitrineFotos = [
    {
      imagem: medicaPrancheta,
      alt: 'Médica sorrindo com prancheta na recepção',
      tag: 'Recepção Ágil',
      titulo: 'Recepção sem filas',
      resumo: 'Saiba quem chegou e o tempo de espera em tempo real.',
    },
    {
      imagem: medicoConsultorio,
      alt: 'Médico em consultório moderno',
      tag: 'Consultório',
      titulo: 'Mais foco no paciente',
      resumo: 'Menos digitação e histórico completo em uma única tela.',
    },
    {
      imagem: medicoJovem,
      alt: 'Médico emitindo receita digital',
      tag: 'Zero Papel',
      titulo: 'Documentos em 1 clique',
      resumo: 'Receitas, atestados e exames em PDF prontos na hora.',
    },
    {
      imagem: medicoSenior,
      alt: 'Diretor clínico acompanhando resultados da rede',
      tag: 'Multi-Unidades',
      titulo: 'Gestão que dá resultado',
      resumo: 'Controle várias unidades e decisões com números claros.',
    },
  ];

  return (
    <div className="space-y-16 py-14 sm:py-16">
      {/* 1. Impacto Financeiro e Economia de Tempo */}
      <section
        id="economia"
        aria-labelledby="economia-heading"
        className="mx-auto max-w-7xl scroll-mt-20 space-y-8 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            Retorno Imediato
          </Badge>
          <h2
            id="economia-heading"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Quanto sua clínica economiza ao sair do manual
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Menos tempo perdido com tarefas repetitivas significa mais consultas
            realizadas e menor custo operacional todo mês.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDICADORES_ECONOMIA.map((item) => {
            const Icone = item.icone;
            return (
              <Card
                key={item.titulo}
                className="border-primary/15 bg-gradient-to-b from-card to-accent/25 transition-shadow hover:shadow-card-hover"
              >
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                      {item.valor}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icone className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {item.titulo}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.descricao}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 2. Vitrine Visual Enxuta com as Fotos da Pasta Business */}
      <section
        id="vantagens"
        aria-labelledby="vantagens-heading"
        className="scroll-mt-20 border-y bg-muted/35 py-14"
      >
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Badge variant="secondary" className="px-3 py-1 text-xs">
                Rotina Transformada
              </Badge>
              <h2
                id="vantagens-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Feito para médicos, recepção e gestores
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Cada área da clínica trabalha integrada, sem retrabalho e com sigilo
              total dos dados.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vitrineFotos.map((item) => (
              <div
                key={item.titulo}
                className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-card-hover"
              >
                {item.imagem ? (
                  <div className="overflow-hidden">
                    <img
                      src={item.imagem}
                      alt={item.alt}
                      className="h-56 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {item.tag}
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {item.titulo}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.resumo}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Faixa Compacta de Personalização com os Logotipos */}
          <div className="grid items-center gap-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-12">
            <div className="min-w-0 space-y-2 lg:col-span-7">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Palette className="h-4 w-4" aria-hidden="true" />
                <span>Sua Marca em Destaque</span>
              </div>
              <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                Um sistema com as cores e o logotipo da sua clínica
              </h3>
              <p className="text-sm text-muted-foreground">
                Personalize o visual em segundos e impressione seus pacientes desde a
                recepção até o receituário impresso ou digital.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5">
              <div className="flex items-center justify-center rounded-2xl border bg-background p-4">
                {miniBranco ? (
                  <img
                    src={miniBranco}
                    alt="Logotipo NewClin versão clara"
                    className="h-12 w-auto rounded object-contain"
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-center rounded-2xl border bg-primary p-4">
                {miniAzul ? (
                  <img
                    src={miniAzul}
                    alt="Logotipo NewClin versão azul"
                    className="h-12 w-auto rounded object-contain"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CTA Final Direto */}
      <section
        aria-labelledby="cta-final-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div
          className="relative isolate overflow-hidden rounded-3xl bg-primary bg-cover bg-center px-6 py-10 text-primary-foreground shadow-modal sm:px-12 sm:py-14"
          style={
            loginBackground
              ? { backgroundImage: `url(${JSON.stringify(loginBackground)})` }
              : undefined
          }
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-sidebar/95 via-primary/90 to-info/85"
          />

          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                {miniIconeTransparente ? (
                  <img
                    src={miniIconeTransparente}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 rounded-sm bg-card p-0.5 object-contain"
                  />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Simples, rápido e 100% na nuvem</span>
              </div>
              <h2
                id="cta-final-heading"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Pare de perder tempo e dinheiro com planilhas
              </h2>
              <p className="text-sm opacity-90 sm:text-base">
                Modernize sua clínica hoje e sinta o ganho de produtividade já na
                primeira semana.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full rounded-full px-8 font-semibold shadow-card sm:w-auto"
            >
              <Link href="/login">
                Acessar Plataforma Agora
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
