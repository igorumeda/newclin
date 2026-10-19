/**
 * Result Pattern — erros de negócio circulam como valor, nunca como exception.
 * Isomórfico e sem dependências externas.
 */

export type ResultConstructorParams<T, E> = {
  isSuccess: boolean;
  value?: T;
  error?: E;
};

export class Result<T, E = Error> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(params: ResultConstructorParams<T, E>) {
    this._isSuccess = params.isSuccess;
    this._value = params.value;
    this._error = params.error;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (this.isFailure) {
      throw new Error('Cannot get value of a failed result');
    }
    return this._value as T;
  }

  get error(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error of a successful result');
    }
    return this._error as E;
  }

  public static ok<T>(value?: T): Result<T> {
    return new Result<T, Error>({ isSuccess: true, value });
  }

  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>({ isSuccess: false, error });
  }

  /** Encadeia operações que retornam Result, propagando a falha. */
  public flatMap<U>(mapper: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return mapper(this._value as T);
  }

  /** Transforma o valor de sucesso, preservando a falha. */
  public map<U>(mapper: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return new Result<U, E>({ isSuccess: true, value: mapper(this._value as T) });
  }
}
