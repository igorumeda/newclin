import { Result } from './result';

export type GuardArgument = { value: unknown; argumentName: string };
export type GuardAgainstNullParams = { args: GuardArgument[] };
export type GuardRangeParams = { value: number; min: number; max: number; argumentName: string };
export type GuardLengthParams = { value: string; min: number; max: number; argumentName: string };
export type GuardOneOfParams = { value: string; allowed: readonly string[]; argumentName: string };

export class Guard {
  public static againstNullOrUndefined({ args }: GuardAgainstNullParams): Result<void> {
    for (const arg of args) {
      if (arg.value === null || arg.value === undefined || arg.value === '') {
        return Result.fail(new Error(`${arg.argumentName} é obrigatório`));
      }
    }
    return Result.ok();
  }

  public static inRange({ value, min, max, argumentName }: GuardRangeParams): Result<void> {
    if (Number.isNaN(value) || value < min || value > max) {
      return Result.fail(new Error(`${argumentName} deve estar entre ${min} e ${max}`));
    }
    return Result.ok();
  }

  public static lengthBetween({ value, min, max, argumentName }: GuardLengthParams): Result<void> {
    const length = value.trim().length;
    if (length < min || length > max) {
      return Result.fail(
        new Error(`${argumentName} deve ter entre ${min} e ${max} caracteres`),
      );
    }
    return Result.ok();
  }

  public static isOneOf({ value, allowed, argumentName }: GuardOneOfParams): Result<void> {
    if (!allowed.includes(value)) {
      return Result.fail(new Error(`${argumentName} inválido: ${value}`));
    }
    return Result.ok();
  }
}
