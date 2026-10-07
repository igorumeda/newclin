import { useId } from 'react';
import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils/cn.util';

export type FormFieldProps = {
  rotulo: string;
  children: ReactElement;
  erro?: string;
  ajuda?: string;
  obrigatorio?: boolean;
  className?: string;
};

export function FormField({
  rotulo,
  children,
  erro,
  ajuda,
  obrigatorio,
  className,
}: FormFieldProps) {
  const id = useId();
  const descricaoId = `${id}-descricao`;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio ? (
          <span className="ml-1 text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {cloneElement(children, {
        id,
        'aria-invalid': Boolean(erro) || undefined,
        'aria-describedby': erro || ajuda ? descricaoId : undefined,
      })}
      {erro ? (
        <p id={descricaoId} className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {!erro && ajuda ? (
        <p id={descricaoId} className="text-sm text-muted-foreground">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}
