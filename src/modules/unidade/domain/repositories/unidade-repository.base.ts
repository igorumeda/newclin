import type { Unidade } from '../entities/unidade.entity';
import type {
  BuscarUnidadeParams,
  IUnidadeRepository,
  ListarUnidadesParams,
} from './unidade-repository.interface';

export abstract class UnidadeRepository implements IUnidadeRepository {
  abstract buscarPorId(params: BuscarUnidadeParams): Promise<Unidade | null>;
  abstract listar(params: ListarUnidadesParams): Promise<Unidade[]>;
  abstract salvar(unidade: Unidade): Promise<void>;
  abstract atualizar(unidade: Unidade): Promise<void>;
}
