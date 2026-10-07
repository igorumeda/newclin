import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import { ROTULO_STATUS } from '../../../domain/value-objects/status-agendamento.vo';
import type { StatusAgendamentoValue } from '../../../domain/value-objects/status-agendamento.vo';

export type StatusBadgeProps = { status: StatusAgendamentoValue };

const VARIANTE_POR_STATUS: Record<StatusAgendamentoValue, BadgeProps['variant']> = {
  agendado: 'secondary',
  confirmado: 'info',
  aguardando: 'warning',
  em_atendimento: 'default',
  finalizado: 'success',
  cancelado: 'outline',
  faltou: 'destructive',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={VARIANTE_POR_STATUS[status]}>{ROTULO_STATUS[status]}</Badge>;
}
