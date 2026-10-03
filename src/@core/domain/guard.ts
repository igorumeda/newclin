import { Result } from './result';

/**
 * Guard — validações encadeadas que produzem Result.
 * Mantém as invariantes fora das entidades quando a checagem é genérica.
 */
export type GuardCheck = { condition: boolean; error: Error };

export class Guard {
  public static againstEmpty(value: string | null | undefined, message: string): Result<string> {
    if (!value || value.trim().length === 0) {
      return Result.fail(new Error(message));
    }
    return Result.ok(value.trim());
  }

  public static againstLength(params: {
    value: string;
    min?: number;
    max?: number;
    message: string;
  }): Result<string> {
    const { value, min, max, message } = params;

    if (typeof min === 'number' && value.length < min) {
      return Result.fail(new Error(message));
    }
    if (typeof max === 'number' && value.length > max) {
      return Result.fail(new Error(message));
    }
    return Result.ok(value);
  }

  public static combine(checks: GuardCheck[]): Result<void> {
    const failed = checks.find((check) => !check.condition);
    if (failed) {
      return Result.fail(failed.error);
    }
    return Result.ok();
  }
}
