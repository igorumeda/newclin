'use client';

import * as Icones from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type IconProps = LucideProps & { nome: string };

type MapaIcones = Record<string, React.ComponentType<LucideProps>>;

/** Resolve o ícone pelo nome declarado na configuração de navegação. */
export function Icon({ nome, ...props }: IconProps) {
  const mapa = Icones as unknown as MapaIcones;
  const Componente = mapa[nome] ?? Icones.Circle;
  return <Componente {...props} />;
}
