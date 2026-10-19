import { Mapper } from '@core/application/mapper.base';
import type { Usuario } from '../../domain/entities/usuario.entity';

export type UsuarioDto = {
  id: string;
  redeId: string;
  nome: string;
  email: string;
  role: string;
  roleLabel: string;
  telefone: string | null;
  unidadesAcesso: string[];
  profissionalId: string | null;
  ativo: boolean;
  ultimoAcessoEm: string | null;
  createdAt: string;
};

export type MapUsuarioParams = { usuario: Usuario };

export class UsuarioMapper extends Mapper<MapUsuarioParams, UsuarioDto> {
  public map({ usuario }: MapUsuarioParams): UsuarioDto {
    return {
      id: usuario.id.toString(),
      redeId: usuario.redeId,
      nome: usuario.nome.value,
      email: usuario.email.value,
      role: usuario.role.value,
      roleLabel: usuario.role.label,
      telefone: usuario.telefone,
      unidadesAcesso: usuario.unidadesAcesso,
      profissionalId: usuario.profissionalId,
      ativo: usuario.ativo,
      ultimoAcessoEm: usuario.ultimoAcessoEm ? usuario.ultimoAcessoEm.toISOString() : null,
      createdAt: usuario.createdAt.toISOString(),
    };
  }
}
