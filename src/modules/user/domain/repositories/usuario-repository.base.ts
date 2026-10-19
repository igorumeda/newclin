import type { Usuario } from '../entities/usuario.entity';
import type { Email } from '../value-objects/email.vo';
import type {
  IUsuarioRepository,
  ListarUsuariosFiltro,
  ListarUsuariosResultado,
  UsuarioId,
} from './usuario-repository.interface';

export abstract class UsuarioRepository implements IUsuarioRepository {
  abstract findById(id: UsuarioId): Promise<Usuario | null>;
  abstract findByEmail(email: Email): Promise<Usuario | null>;
  abstract listar(filtro: ListarUsuariosFiltro): Promise<ListarUsuariosResultado>;
  abstract save(usuario: Usuario): Promise<void>;
  abstract update(usuario: Usuario): Promise<void>;
  abstract existsByEmail(email: Email, ignorarId?: UsuarioId): Promise<boolean>;
}
