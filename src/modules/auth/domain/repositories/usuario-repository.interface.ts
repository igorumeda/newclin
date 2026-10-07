import type { Usuario } from '../entities/usuario.entity';
import type { Email } from '../value-objects/email.vo';

export type UsuarioId = string;
export type RedeId = string;
export type BuscarUsuarioParams = { redeId: RedeId; id: UsuarioId };
export type BuscarPorEmailParams = { email: Email };
export type ListarUsuariosParams = { redeId: RedeId; busca?: string; incluirInativos?: boolean };
export type ExisteEmailParams = { email: Email; ignorarId?: UsuarioId };

export interface IUsuarioRepository {
  buscarPorId(params: BuscarUsuarioParams): Promise<Usuario | null>;
  buscarPorEmail(params: BuscarPorEmailParams): Promise<Usuario | null>;
  listar(params: ListarUsuariosParams): Promise<Usuario[]>;
  salvar(usuario: Usuario): Promise<void>;
  atualizar(usuario: Usuario): Promise<void>;
  existeEmail(params: ExisteEmailParams): Promise<boolean>;
}

export const USUARIO_REPOSITORY = Symbol('IUsuarioRepository');
