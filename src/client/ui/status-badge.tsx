import { Badge, type BadgeProps } from '@/client/ui/badge';
import { STATUS_LABELS, type StatusAgendamento } from '@/modules/scheduling/domain/value-objects/status-agendamento.vo';

const VARIANTE_POR_STATUS: Record<StatusAgendamento, NonNullable<BadgeProps['variant']>> = {
  agendado: 'secondary',
  confirmado: 'info',
  aguardando: 'warning',
  em_atendimento: 'default',
  finalizado: 'success',
  cancelado: 'destructive',
  faltou: 'warning',
};

export function StatusAgendamentoBadge({ status }: { status: string }) {
  const chave = (status as StatusAgendamento) in VARIANTE_POR_STATUS ? (status as StatusAgendamento) : null;

  if (!chave) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge variant={VARIANTE_POR_STATUS[chave]} data-status={chave}>
      {STATUS_LABELS[chave]}
    </Badge>
  );
}

export const VARIANTE_POR_STATUS_AGENDAMENTO = VARIANTE_POR_STATUS;

/** Cor de destaque do card de agendamento (usa as cores do tipo de atendimento). */
export function CorTipoAtendimento({ cor, className }: { cor?: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={className ?? 'inline-block size-2.5 shrink-0 rounded-full'}
      style={{ backgroundColor: cor ?? 'hsl(var(--muted-foreground))' }}
    />
  );
}
