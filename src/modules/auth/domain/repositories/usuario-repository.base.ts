import type { Usuario } from '../entities/usuario.entity';
import type {
  BuscarPorEmailParams,
  BuscarUsuarioParams,
  ExisteEmailParams,
  IUsuarioRepository,
  ListarUsuariosParams,
} from './usuario-repository.interface';

export abstract class UsuarioRepository implements IUsuarioRepository {
  abstract buscarPorId(params: BuscarUsuarioParams): Promise<Usuario | null>;
  abstract buscarPorEmail(params: BuscarPorEmailParams): Promise<Usuario | null>;
  abstract listar(params: ListarUsuariosParams): Promise<Usuario[]>;
  abstract salvar(usuario: Usuario): Promise<void>;
  abstract atualizar(usuario: Usuario): Promise<void>;
  abstract existeEmail(params: ExisteEmailParams): Promise<boolean>;
}
