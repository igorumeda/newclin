import type { Rede } from '../entities/rede.entity';
import type { IRedeRepository, RedeId } from './rede-repository.interface';

export abstract class RedeRepository implements IRedeRepository {
  abstract findById(id: RedeId): Promise<Rede | null>;
  abstract update(rede: Rede): Promise<void>;
}
