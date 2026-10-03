import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import type { CanalNotificacao } from './tipos.vo';

export type DestinatarioProps = {
  canal: CanalNotificacao;
  valor: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Destinatário — normaliza e valida e-mail e telefone antes do enfileiramento:
 * e-mails em minúsculas e telefones em E.164 sem o "+" (padrão Meta Cloud API).
 */
export class Destinatario extends ValueObject<DestinatarioProps> {
  private constructor(props: DestinatarioProps) {
    super(props);
  }

  get canal(): CanalNotificacao {
    return this.props.canal;
  }

  get valor(): string {
    return this.props.valor;
  }

  public static paraEmail(email: string): Result<Destinatario> {
    const normalized = (email ?? '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      return Result.fail(new Error('E-mail do destinatário inválido'));
    }
    return Result.ok(new Destinatario({ canal: 'email', valor: normalized }));
  }

  /** Aceita formatos brasileiros: +55 (11) 91234-5678, 11912345678, etc. */
  public static paraWhatsapp(telefone: string, paisPadrao = '55'): Result<Destinatario> {
    const digits = (telefone ?? '').replace(/\D/g, '');
    if (digits.length < 10) {
      return Result.fail(new Error('Telefone do destinatário inválido para WhatsApp'));
    }

    const comPais = digits.startsWith(paisPadrao) && digits.length >= 12 ? digits : `${paisPadrao}${digits}`;
    if (comPais.length < 12 || comPais.length > 15) {
      return Result.fail(new Error('Telefone do destinatário inválido para WhatsApp'));
    }

    return Result.ok(new Destinatario({ canal: 'whatsapp', valor: comPais }));
  }

  public static create(canal: CanalNotificacao, valor: string): Result<Destinatario> {
    return canal === 'email' ? Destinatario.paraEmail(valor) : Destinatario.paraWhatsapp(valor);
  }

  public static reconstitute(canal: CanalNotificacao, valor: string): Destinatario {
    return new Destinatario({ canal, valor });
  }
}
