import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const CANAIS_NOTIFICACAO = ['email', 'whatsapp'] as const;
export type CanalNotificacaoValue = (typeof CANAIS_NOTIFICACAO)[number];
export type CanalNotificacaoProps = { value: CanalNotificacaoValue };

export const ROTULO_CANAL: Record<CanalNotificacaoValue, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
};

export class CanalNotificacao extends ValueObject<CanalNotificacaoProps> {
  private constructor(props: CanalNotificacaoProps) {
    super(props);
  }

  get value(): CanalNotificacaoValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_CANAL[this.props.value];
  }

  public static create(canal: string): Result<CanalNotificacao> {
    if (!CANAIS_NOTIFICACAO.includes(canal as CanalNotificacaoValue)) {
      return Result.fail(new Error(`Canal de notificação inválido: ${canal}`));
    }
    return Result.ok(new CanalNotificacao({ value: canal as CanalNotificacaoValue }));
  }

  public static reconstitute(value: CanalNotificacaoValue): CanalNotificacao {
    return new CanalNotificacao({ value });
  }
}
