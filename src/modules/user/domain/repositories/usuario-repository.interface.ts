import type { Usuario } from '../entities/usuario.entity';
import type { Email } from '../value-objects/email.vo';

export type UsuarioId = string;
export type RedeId = string;

export type ListarUsuariosFiltro = {
  redeId: RedeId;
  busca?: string | null;
  role?: string | null;
  ativo?: boolean | null;
  page: number;
  perPage: number;
};

export type ListarUsuariosResultado = {
  items: Usuario[];
  total: number;
};

export interface IUsuarioRepository {
  findById(id: UsuarioId): Promise<Usuario | null>;
  findByEmail(email: Email): Promise<Usuario | null>;
  listar(filtro: ListarUsuariosFiltro): Promise<ListarUsuariosResultado>;
  save(usuario: Usuario): Promise<void>;
  update(usuario: Usuario): Promise<void>;
  existsByEmail(email: Email, ignorarId?: UsuarioId): Promise<boolean>;
}

export const USUARIO_REPOSITORY = Symbol('IUsuarioRepository');
