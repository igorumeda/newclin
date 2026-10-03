export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Maybe<T> = T | null | undefined;

export function isPresent<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}
