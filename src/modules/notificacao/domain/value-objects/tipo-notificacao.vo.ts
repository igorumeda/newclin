import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const TIPOS_NOTIFICACAO = [
  'confirmacao_agendamento',
  'lembrete_consulta',
  'cancelamento_agendamento',
  'documento_clinico',
] as const;

export type TipoNotificacaoValue = (typeof TIPOS_NOTIFICACAO)[number];
export type TipoNotificacaoProps = { value: TipoNotificacaoValue };

export const ROTULO_TIPO_NOTIFICACAO: Record<TipoNotificacaoValue, string> = {
  confirmacao_agendamento: 'Confirmação de agendamento',
  lembrete_consulta: 'Lembrete de consulta',
  cancelamento_agendamento: 'Cancelamento de agendamento',
  documento_clinico: 'Documento clínico',
};

export class TipoNotificacao extends ValueObject<TipoNotificacaoProps> {
  private constructor(props: TipoNotificacaoProps) {
    super(props);
  }

  get value(): TipoNotificacaoValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_TIPO_NOTIFICACAO[this.props.value];
  }

  public static create(tipo: string): Result<TipoNotificacao> {
    if (!TIPOS_NOTIFICACAO.includes(tipo as TipoNotificacaoValue)) {
      return Result.fail(new Error(`Tipo de notificação inválido: ${tipo}`));
    }
    return Result.ok(new TipoNotificacao({ value: tipo as TipoNotificacaoValue }));
  }

  public static reconstitute(value: TipoNotificacaoValue): TipoNotificacao {
    return new TipoNotificacao({ value });
  }
}
