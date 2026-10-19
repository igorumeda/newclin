import type { Rede } from '../entities/rede.entity';

export type RedeId = string;

export interface IRedeRepository {
  findById(id: RedeId): Promise<Rede | null>;
  update(rede: Rede): Promise<void>;
}

export const REDE_REPOSITORY = Symbol('IRedeRepository');
