import { Mapper } from '@core/application/mapper.base';
import type { RegistroAuditoria } from '../../domain/entities/registro-auditoria.entity';
import type { RegistroAuditoriaOutputDto } from './auditoria.output.dto';

export type AuditoriaMapperParams = { registro: RegistroAuditoria };

export class AuditoriaMapper extends Mapper<AuditoriaMapperParams, RegistroAuditoriaOutputDto> {
  public map({ registro }: AuditoriaMapperParams): RegistroAuditoriaOutputDto {
    return {
      id: registro.id.toString(),
      usuarioId: registro.usuarioId,
      usuarioNome: registro.usuarioNome,
      unidadeId: registro.unidadeId,
      acao: registro.acao,
      acaoRotulo: registro.acaoRotulo,
      entidade: registro.entidade,
      entidadeId: registro.entidadeId,
      descricao: registro.descricao,
      dadosAntes: registro.dadosAntes,
      dadosDepois: registro.dadosDepois,
      ip: registro.ip,
      criadoEm: registro.createdAt.toISOString(),
    };
  }
}
