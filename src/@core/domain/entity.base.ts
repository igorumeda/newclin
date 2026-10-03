import { Identifier } from './identifier';

/**
 * `createdAt`/`updatedAt` são opcionais para permitir que os mappers de
 * persistência reconstituam a entidade preservando os timestamps do banco.
 */
export type EntityConstructorParams<Props> = {
  props: Props;
  id?: Identifier;
  createdAt?: Date;
  updatedAt?: Date;
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
    this._createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? this._createdAt;
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
    return this._id.equals(entity._id);
  }
}
