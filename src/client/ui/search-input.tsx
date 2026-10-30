'use client';

import { useId, useRef } from 'react';
import type { ChangeEventHandler } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/client/ui/input';
import { cn } from '@/shared/utils/cn.util';

type SearchValue = string;
type SearchValueChangeHandler = (value: SearchValue) => void;

export type SearchInputProps = {
  value: SearchValue;
  onValueChange: SearchValueChangeHandler;
  label: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchInput({
  value,
  onValueChange,
  label,
  id,
  placeholder = 'Buscar...',
  disabled = false,
  className,
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onValueChange(event.currentTarget.value);
  };

  const clearSearch = () => {
    onValueChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('w-full min-w-0', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative min-w-0">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          id={inputId}
          type="text"
          role="searchbox"
          inputMode="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="h-[var(--control-height)] w-full min-w-0 pl-10 pr-12 text-base sm:text-sm"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            disabled={disabled}
            aria-label={`Limpar ${label.toLowerCase()}`}
            className="absolute right-0 top-0 flex h-[var(--control-height)] w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

