import { Mapper } from '@core/application/mapper.base';
import type { Usuario } from '../../domain/entities/usuario.entity';
import type { UsuarioOutputDto } from './usuario.output.dto';

export type MapUsuarioParams = { usuario: Usuario };

export class UsuarioMapper extends Mapper<MapUsuarioParams, UsuarioOutputDto> {
  public map({ usuario }: MapUsuarioParams): UsuarioOutputDto {
    return {
      id: usuario.id.toString(),
      redeId: usuario.redeId,
      nome: usuario.nome.value,
      email: usuario.email.value,
      role: usuario.papel.value,
      rotuloRole: usuario.papel.rotulo,
      permissoes: [...usuario.papel.permissoes],
      unidadesAcesso: usuario.unidadesAcesso,
      profissionalId: usuario.profissionalId,
      telefone: usuario.telefone,
      avatarUrl: usuario.avatarUrl,
      ativo: usuario.ativo,
      ultimoAcessoEm: usuario.ultimoAcessoEm?.toISOString() ?? null,
      criadoEm: usuario.createdAt.toISOString(),
    };
  }
}
