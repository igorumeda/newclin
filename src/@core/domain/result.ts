export type ResultConstructorParams<T, E> = { isSuccess: boolean; value?: T; error?: E };

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
    if (this.isFailure) throw new Error('Cannot get value of a failed result');
    return this._value as T;
  }

  get error(): E {
    if (this.isSuccess) throw new Error('Cannot get error of a successful result');
    return this._error as E;
  }

  public static ok<T>(value?: T): Result<T> {
    return new Result<T, Error>({ isSuccess: true, value });
  }

  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>({ isSuccess: false, error });
  }

  /** Propaga a falha de um Result de outro tipo mantendo a tipagem do destino. */
  public static propagate<T>(failed: Result<unknown, Error>): Result<T> {
    return Result.fail<T, Error>(failed.error) as Result<T>;
  }

  /** Retorna a primeira falha encontrada em uma lista de resultados. */
  public static firstFailure(results: Result<unknown, Error>[]): Result<unknown, Error> | null {
    return results.find((result) => result.isFailure) ?? null;
  }
}
