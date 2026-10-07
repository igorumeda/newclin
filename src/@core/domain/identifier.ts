export type IdentifierValue = string;
export type IdentifierEqualsParams = { identifier?: Identifier };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Identificador isomórfico. Usa a Web Crypto API, disponível tanto no browser
 * quanto em runtimes server modernos (Node 19+, Deno, Bun, Edge).
 */
export class Identifier {
  private readonly _value: IdentifierValue;

  private constructor(value: IdentifierValue) {
    this._value = value;
  }

  public static create(): Identifier {
    return new Identifier(Identifier.randomUuid());
  }

  public static fromExisting(value: IdentifierValue): Identifier {
    return new Identifier(value);
  }

  public static isValid(value: IdentifierValue): boolean {
    return UUID_PATTERN.test(value);
  }

  private static randomUuid(): string {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  public equals({ identifier }: IdentifierEqualsParams): boolean {
    if (!identifier) return false;
    return this._value === identifier._value;
  }

  public toString(): IdentifierValue {
    return this._value;
  }

  public get value(): IdentifierValue {
    return this._value;
  }
}
