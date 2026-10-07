import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const STATUS_AGENDAMENTO = [
  'agendado',
  'confirmado',
  'aguardando',
  'em_atendimento',
  'finalizado',
  'cancelado',
  'faltou',
] as const;

export type StatusAgendamentoValue = (typeof STATUS_AGENDAMENTO)[number];
export type StatusAgendamentoProps = { value: StatusAgendamentoValue };
export type PodeTransitarParams = { destino: StatusAgendamentoValue };

export const ROTULO_STATUS: Record<StatusAgendamentoValue, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

/** Máquina de estados definida na spec §3.4. */
export const TRANSICOES_PERMITIDAS: Record<StatusAgendamentoValue, StatusAgendamentoValue[]> = {
  agendado: ['confirmado', 'aguardando', 'cancelado', 'faltou'],
  confirmado: ['aguardando', 'cancelado', 'faltou'],
  aguardando: ['em_atendimento', 'cancelado'],
  em_atendimento: ['finalizado', 'cancelado'],
  finalizado: [],
  cancelado: [],
  faltou: [],
};

export const STATUS_ATIVOS: StatusAgendamentoValue[] = [
  'agendado',
  'confirmado',
  'aguardando',
  'em_atendimento',
];

export class StatusAgendamento extends ValueObject<StatusAgendamentoProps> {
  private constructor(props: StatusAgendamentoProps) {
    super(props);
  }

  get value(): StatusAgendamentoValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_STATUS[this.props.value];
  }

  get isFinal(): boolean {
    return TRANSICOES_PERMITIDAS[this.props.value].length === 0;
  }

  get isAtivo(): boolean {
    return STATUS_ATIVOS.includes(this.props.value);
  }

  public podeTransitarPara({ destino }: PodeTransitarParams): boolean {
    return TRANSICOES_PERMITIDAS[this.props.value].includes(destino);
  }

  public static create(status: string): Result<StatusAgendamento> {
    if (!STATUS_AGENDAMENTO.includes(status as StatusAgendamentoValue)) {
      return Result.fail(new Error(`Status de agendamento inválido: ${status}`));
    }
    return Result.ok(new StatusAgendamento({ value: status as StatusAgendamentoValue }));
  }

  public static reconstitute(value: StatusAgendamentoValue): StatusAgendamento {
    return new StatusAgendamento({ value });
  }

  public static inicial(): StatusAgendamento {
    return new StatusAgendamento({ value: 'agendado' });
  }
}
