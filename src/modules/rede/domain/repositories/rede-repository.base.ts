import type { Rede } from '../entities/rede.entity';
import type {
  BuscarRedeParams,
  BuscarRedePorSlugParams,
  IRedeRepository,
} from './rede-repository.interface';

export abstract class RedeRepository implements IRedeRepository {
  abstract buscarPorId(params: BuscarRedeParams): Promise<Rede | null>;
  abstract buscarPorSlug(params: BuscarRedePorSlugParams): Promise<Rede | null>;
  abstract salvar(rede: Rede): Promise<void>;
  abstract atualizar(rede: Rede): Promise<void>;
}
