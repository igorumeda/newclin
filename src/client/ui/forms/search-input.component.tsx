'use client';

import { Search, X } from 'lucide-react';
import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils/cn.util';

export type SearchInputProps = {
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
  rotulo?: string;
  className?: string;
};

export function SearchInput({
  valor,
  aoAlterar,
  placeholder = 'Buscar…',
  rotulo = 'Buscar',
  className,
}: SearchInputProps) {
  const id = useId();

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Label htmlFor={id} className="sr-only">
        {rotulo}
      </Label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        role="searchbox"
        type="search"
        value={valor}
        placeholder={placeholder}
        onChange={(evento) => aoAlterar(evento.target.value)}
        className="pl-10 pr-12 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {valor ? (
        <button
          type="button"
          onClick={() => aoAlterar('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
