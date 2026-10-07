import type { Anexo } from '../entities/anexo.entity';
import type {
  BuscarAnexoParams,
  IAnexoRepository,
  ListarAnexosParams,
  RemoverAnexoParams,
} from './anexo-repository.interface';

export abstract class AnexoRepository implements IAnexoRepository {
  abstract buscarPorId(params: BuscarAnexoParams): Promise<Anexo | null>;
  abstract listar(params: ListarAnexosParams): Promise<Anexo[]>;
  abstract salvar(anexo: Anexo): Promise<void>;
  abstract remover(params: RemoverAnexoParams): Promise<void>;
}
