export type Primitive = string | number | boolean | Date | null | undefined;

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type Writable<T> = {
  -readonly [Key in keyof T]: T[Key];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [Key in Keys]-?: Required<Pick<T, Key>> & Partial<Pick<T, Exclude<Keys, Key>>>;
  }[Keys];
