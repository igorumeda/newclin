import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type UserNameValue = string;
export type UserNameProps = { value: UserNameValue };

const MIN_LENGTH = 3;
const MAX_LENGTH = 120;

export class UserName extends ValueObject<UserNameProps> {
  private constructor(props: UserNameProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(name: UserNameValue): Result<UserName> {
    const normalized = name.trim().replace(/\s+/g, ' ');

    if (normalized.length < MIN_LENGTH) {
      return Result.fail(new Error('Nome deve ter no mínimo 3 caracteres'));
    }
    if (normalized.length > MAX_LENGTH) {
      return Result.fail(new Error('Nome deve ter no máximo 120 caracteres'));
    }
    if (!/^[\p{L}\s'.-]+$/u.test(normalized)) {
      return Result.fail(new Error('Nome contém caracteres inválidos'));
    }

    return Result.ok(new UserName({ value: normalized }));
  }

  public static reconstitute(value: UserNameValue): UserName {
    return new UserName({ value });
  }
}
