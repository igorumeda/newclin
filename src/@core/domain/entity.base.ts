import { Identifier } from './identifier';

export type EntityTimestamps = { createdAt?: Date; updatedAt?: Date };
export type EntityConstructorParams<Props> = {
  props: Props;
  id?: Identifier;
  timestamps?: EntityTimestamps;
};
export type EntityEqualsParams<Props> = { entity?: Entity<Props> };

export abstract class Entity<Props> {
  protected readonly _id: Identifier;
  protected readonly props: Props;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  protected constructor(params: EntityConstructorParams<Props>) {
    this._id = params.id ?? Identifier.create();
    this.props = params.props;
    this._createdAt = params.timestamps?.createdAt ?? new Date();
    this._updatedAt = params.timestamps?.updatedAt ?? new Date();
  }

  get id(): Identifier {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  public equals({ entity }: EntityEqualsParams<Props>): boolean {
    if (!entity || !(entity instanceof Entity)) return false;
    return this._id.equals({ identifier: entity._id });
  }
}
