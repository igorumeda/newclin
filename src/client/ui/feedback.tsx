import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/client/lib/utils';

// ── Alert ───────────────────────────────────────────────────────────────────
const alertVariants = cva('relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-7', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      info: 'border-info/40 bg-info/5 text-foreground [&>svg]:text-info',
      success: 'border-success/40 bg-success/5 text-foreground [&>svg]:text-success',
      warning: 'border-warning/50 bg-warning/10 text-foreground [&>svg]:text-warning',
      destructive: 'border-destructive/50 bg-destructive/5 text-destructive [&>svg]:text-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

const ICONES = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  destructive: AlertCircle,
} as const;

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const Icone = ICONES[variant ?? 'default'];

  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icone aria-hidden />
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

// ── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function TabelaSkeleton({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: linhas }).map((_, indice) => (
        <Skeleton key={indice} className="h-11 w-full" />
      ))}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
export type EstadoVazioProps = {
  titulo: string;
  descricao?: string;
  icone?: React.ElementType;
  acao?: React.ReactNode;
  className?: string;
};

export function EstadoVazio({ titulo, descricao, icone: Icone, acao, className }: EstadoVazioProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center', className)}>
      {Icone ? <Icone className="size-8 text-muted-foreground" aria-hidden /> : null}
      <p className="font-medium">{titulo}</p>
      {descricao ? <p className="max-w-md text-sm text-muted-foreground">{descricao}</p> : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}

// ── Separator ───────────────────────────────────────────────────────────────
export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}
