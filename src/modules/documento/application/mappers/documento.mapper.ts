import { Mapper } from '@core/application/mapper.base';
import type { Documento } from '../../domain/entities/documento.entity';
import type { DocumentoOutputDto } from './documento.output.dto';

export type DocumentoMapperParams = { documento: Documento };

export class DocumentoMapper extends Mapper<DocumentoMapperParams, DocumentoOutputDto> {
  public map({ documento }: DocumentoMapperParams): DocumentoOutputDto {
    return {
      id: documento.id.toString(),
      redeId: documento.redeId,
      unidadeId: documento.unidadeId,
      pacienteId: documento.pacienteId,
      atendimentoId: documento.atendimentoId,
      profissionalId: documento.profissionalId,
      tipo: documento.tipo.value,
      tipoRotulo: documento.tipo.rotulo,
      conteudo: documento.conteudo,
      status: documento.status,
      storageKey: documento.storageKey,
      pdfUrl: documento.pdfUrl,
      emitidoEm: documento.emitidoEm?.toISOString() ?? null,
      criadoEm: documento.createdAt.toISOString(),
      atualizadoEm: documento.updatedAt.toISOString(),
    };
  }
}
