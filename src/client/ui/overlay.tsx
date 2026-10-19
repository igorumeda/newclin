'use client';

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva } from 'class-variance-authority';
import { cn } from '@/client/lib/utils';
import { buttonVariants } from './button';

// ── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({
  nome,
  className,
  src,
}: {
  nome: string;
  src?: string | null;
  className?: string;
}) {
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    <AvatarPrimitive.Root
      className={cn('inline-flex size-9 shrink-0 overflow-hidden rounded-full bg-primary/10', className)}
    >
      {src ? <AvatarPrimitive.Image src={src} alt={nome} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center text-xs font-semibold text-primary">
        {iniciais || '—'}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────
export function Progress({
  valor,
  className,
  indicadorClassName,
}: {
  valor: number;
  className?: string;
  indicadorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      value={valor}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 bg-primary transition-all', indicadorClassName)}
        style={{ transform: `translateX(-${100 - Math.min(Math.max(valor, 0), 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={6}
        className={cn(
          'z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md',
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

// ── DropdownMenu (subconjunto usado no sistema) ─────────────────────────────
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  variante,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { variante?: 'destructive' }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4',
        variante === 'destructive' && 'text-destructive focus:bg-destructive/10 focus:text-destructive',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />;
}

// ── Popover ─────────────────────────────────────────────────────────────────
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn('z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

// ── AlertDialog (confirmações destrutivas) ──────────────────────────────────
export type ConfirmDialogProps = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  textoConfirmar?: string;
  carregando?: boolean;
  onConfirmar: () => void;
  children?: React.ReactNode;
  /** Conteúdo adicional exibido no corpo (ex.: campo de justificativa). */
  conteudo?: React.ReactNode;
};

export function ConfirmDialog({
  aberto,
  aoMudar,
  titulo,
  descricao,
  textoConfirmar = 'Confirmar',
  carregando = false,
  onConfirmar,
  children,
  conteudo,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={aberto} onOpenChange={aoMudar}>
      {children ? <AlertDialogPrimitive.Trigger asChild>{children}</AlertDialogPrimitive.Trigger> : null}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <AlertDialogPrimitive.Title className="text-lg font-semibold">{titulo}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
            {descricao}
          </AlertDialogPrimitive.Description>
          {conteudo}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: 'outline' }))}>
              Voltar
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={(evento) => {
                evento.preventDefault();
                onConfirmar();
              }}
              className={cn(buttonVariants({ variant: 'destructive' }))}
              disabled={carregando}
            >
              {carregando ? 'Processando…' : textoConfirmar}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export { cva };
