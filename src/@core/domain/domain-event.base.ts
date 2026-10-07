export type DomainEventConstructorParams = { name: string; redeId: string };

export abstract class DomainEvent {
  public readonly name: string;
  public readonly redeId: string;
  public readonly occurredAt: Date;

  protected constructor(params: DomainEventConstructorParams) {
    this.name = params.name;
    this.redeId = params.redeId;
    this.occurredAt = new Date();
  }
}
