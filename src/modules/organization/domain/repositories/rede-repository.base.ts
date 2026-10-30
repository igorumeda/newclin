import type { Rede } from '../entities/rede.entity';
import type {
  ExistsRedeByCnpjParams,
  ExistsRedeBySlugParams,
  IRedeRepository,
  RedeId,
  ResumoMasterRedes,
} from './rede-repository.interface';

export abstract class RedeRepository implements IRedeRepository {
  abstract findById(id: RedeId): Promise<Rede | null>;
  abstract create(rede: Rede): Promise<void>;
  abstract update(rede: Rede): Promise<void>;
  abstract existsByCnpj(params: ExistsRedeByCnpjParams): Promise<boolean>;
  abstract existsBySlug(params: ExistsRedeBySlugParams): Promise<boolean>;
  abstract obterResumoMaster(): Promise<ResumoMasterRedes>;
}
