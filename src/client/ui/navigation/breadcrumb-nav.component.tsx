import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type ItemBreadcrumb = { titulo: string; href?: string };
export type BreadcrumbNavProps = { itens: ItemBreadcrumb[] };

export function BreadcrumbNav({ itens }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {itens.map((item, indice) => (
          <li key={item.titulo} className="flex items-center gap-1">
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.titulo}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.titulo}</span>
            )}
            {indice < itens.length - 1 ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
