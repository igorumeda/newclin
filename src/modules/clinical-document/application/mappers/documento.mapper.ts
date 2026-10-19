import { Mapper } from '@core/application/mapper.base';
import type { Documento } from '../../domain/entities/documento.entity';
import {
  STATUS_DOCUMENTO_LABELS,
  TIPO_DOCUMENTO_LABELS,
} from '../../domain/value-objects/tipo-documento.vo';
import type { DocumentoDto } from '../dtos/documento.dto';

export type EnriquecimentoDocumento = {
  pacienteNome: string | null;
  profissionalNome: string | null;
  unidadeNome: string | null;
};

export type MapDocumentoParams = {
  documento: Documento;
  enriquecimento?: Partial<EnriquecimentoDocumento>;
  urlAssinada?: string | null;
  proximoNumero?: number;
};

export class DocumentoMapper extends Mapper<MapDocumentoParams, DocumentoDto> {
  public map({
    documento,
    enriquecimento,
    urlAssinada = null,
    proximoNumero,
  }: MapDocumentoParams): DocumentoDto {
    return {
      id: documento.id.toString(),
      redeId: documento.redeId,
      unidadeId: documento.unidadeId,
      unidadeNome: enriquecimento?.unidadeNome ?? null,
      pacienteId: documento.pacienteId,
      pacienteNome: enriquecimento?.pacienteNome ?? null,
      atendimentoId: documento.atendimentoId,
      profissionalId: documento.profissionalId,
      profissionalNome: enriquecimento?.profissionalNome ?? null,
      tipo: documento.tipo,
      tipoLabel: TIPO_DOCUMENTO_LABELS[documento.tipo],
      numero: documento.numero,
      numeroFormatado: documento.numeroFormatado(),
      conteudo: documento.conteudo.toJSON(),
      status: documento.status,
      statusLabel: STATUS_DOCUMENTO_LABELS[documento.status] ?? documento.status,
      storageBucket: documento.storageBucket,
      storagePath: documento.storagePath,
      urlAssinada,
      emitidoEm: documento.emitidoEm ? documento.emitidoEm.toISOString() : null,
      emitidoPor: documento.emitidoPor,
      canceladoEm: documento.canceladoEm ? documento.canceladoEm.toISOString() : null,
      motivoCancelamento: documento.motivoCancelamento,
      createdAt: documento.createdAt.toISOString(),
      updatedAt: documento.updatedAt.toISOString(),
      proximoNumero,
    };
  }
}
