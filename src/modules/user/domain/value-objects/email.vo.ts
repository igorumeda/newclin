import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type EmailValue = string;
export type EmailProps = { value: EmailValue };

const MAX_LENGTH = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  private static isValid(email: EmailValue): boolean {
    return EMAIL_PATTERN.test(email);
  }

  public static create(email: EmailValue): Result<Email> {
    const normalized = (email ?? '').trim().toLowerCase();

    if (!normalized) {
      return Result.fail(new Error('E-mail é obrigatório'));
    }
    if (!this.isValid(normalized)) {
      return Result.fail(new Error('Formato de e-mail inválido'));
    }
    if (normalized.length > MAX_LENGTH) {
      return Result.fail(new Error('E-mail muito longo'));
    }

    return Result.ok(new Email({ value: normalized }));
  }

  public static reconstitute(value: EmailValue): Email {
    return new Email({ value });
  }
}
