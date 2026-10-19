/**
 * Identifier — identidade tipada de entidades de domínio.
 * Isomórfico: usa apenas `crypto.randomUUID` quando disponível, com fallback puro.
 */

export type IdentifierValue = string;

export class Identifier {
  private readonly _value: IdentifierValue;

  private constructor(value: IdentifierValue) {
    this._value = value;
  }

  get value(): IdentifierValue {
    return this._value;
  }

  public toString(): string {
    return this._value;
  }

  public equals(other: Identifier): boolean {
    return this._value === other._value;
  }

  public static create(): Identifier {
    return new Identifier(Identifier.generateUuid());
  }

  /** Usado na reconstituição de dados persistidos (valor já confiável). */
  public static fromExisting(value: IdentifierValue): Identifier {
    return new Identifier(value);
  }

  private static generateUuid(): string {
    const globalCrypto = globalThis.crypto as Crypto | undefined;

    if (globalCrypto?.randomUUID) {
      return globalCrypto.randomUUID();
    }

    // Fallback isomórfico (ambientes sem Web Crypto).
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
