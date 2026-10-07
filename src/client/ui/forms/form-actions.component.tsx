import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn.util';

export type FormActionsProps = { children: ReactNode; className?: string };

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end',
        className,
      )}
    >
      {children}
    </div>
  );
}
