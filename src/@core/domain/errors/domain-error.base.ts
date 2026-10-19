export type DomainErrorParams = { message: string; code: string };

export abstract class DomainError extends Error {
  public readonly code: string;

  protected constructor(params: DomainErrorParams) {
    super(params.message);
    this.code = params.code;
  }

  public toJSON(): { code: string; message: string } {
    return { code: this.code, message: this.message };
  }
}
