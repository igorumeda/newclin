import type { Unidade } from '../entities/unidade.entity';
import type {
  IUnidadeRepository,
  ListarUnidadesFiltro,
  UnidadeId,
} from './unidade-repository.interface';

export abstract class UnidadeRepository implements IUnidadeRepository {
  abstract findById(id: UnidadeId): Promise<Unidade | null>;
  abstract listar(filtro: ListarUnidadesFiltro): Promise<Unidade[]>;
  abstract save(unidade: Unidade): Promise<void>;
  abstract update(unidade: Unidade): Promise<void>;
  abstract existsByNome(params: { redeId: string; nome: string; ignorarId?: string }): Promise<boolean>;
  abstract existsByCnes(params: { redeId: string; cnes: string; ignorarId?: string }): Promise<boolean>;
}
