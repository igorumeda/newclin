import { Mapper } from '@core/application/mapper.base';
import type { Auditoria } from '../../domain/entities/auditoria.entity';

export type AuditoriaDto = {
  id: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  usuarioEmail: string | null;
  usuarioRole: string | null;
  unidadeId: string | null;
  acao: string;
  acaoLabel: string;
  entidade: string;
  registroId: string | null;
  descricao: string | null;
  dadosAntes: Record<string, unknown> | null;
  dadosDepois: Record<string, unknown> | null;
  ip: string | null;
  origem: string;
  createdAt: string;
};

export type MapAuditoriaParams = { auditoria: Auditoria };

export class AuditoriaMapper extends Mapper<MapAuditoriaParams, AuditoriaDto> {
  public map({ auditoria }: MapAuditoriaParams): AuditoriaDto {
    return {
      id: auditoria.id.toString(),
      usuarioId: auditoria.usuarioId,
      usuarioNome: auditoria.usuarioNome,
      usuarioEmail: auditoria.usuarioEmail,
      usuarioRole: auditoria.usuarioRole,
      unidadeId: auditoria.unidadeId,
      acao: auditoria.acao.value,
      acaoLabel: auditoria.acao.label,
      entidade: auditoria.entidade,
      registroId: auditoria.registroId,
      descricao: auditoria.descricao,
      dadosAntes: auditoria.dadosAntes,
      dadosDepois: auditoria.dadosDepois,
      ip: auditoria.ip,
      origem: auditoria.origem,
      createdAt: auditoria.createdAt.toISOString(),
    };
  }
}
