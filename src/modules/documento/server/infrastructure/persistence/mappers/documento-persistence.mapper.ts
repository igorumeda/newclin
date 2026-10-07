import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Documento } from '../../../../domain/entities/documento.entity';
import type { StatusDocumento } from '../../../../domain/entities/documento.entity';
import { TipoDocumento } from '../../../../domain/value-objects/tipo-documento.vo';
import type { TipoDocumentoValue } from '../../../../domain/value-objects/tipo-documento.vo';
import type { DocumentoModel, DocumentoModelData } from '../models/documento.model';

export type DocumentoToDomainParams = ToDomainParams<DocumentoModel>;
export type DocumentoToPersistenceParams = ToPersistenceParams<Documento>;

export class DocumentoPersistenceMapper extends PersistenceMapper<
  Documento,
  DocumentoModel,
  DocumentoModelData
> {
  toDomain({ record }: DocumentoToDomainParams): Documento {
    return Documento.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        pacienteId: record.paciente_id,
        atendimentoId: record.atendimento_id,
        profissionalId: record.profissional_id,
        tipo: TipoDocumento.reconstitute(record.tipo as TipoDocumentoValue),
        conteudo: record.conteudo ?? {},
        status: record.status as StatusDocumento,
        storageKey: record.storage_key,
        pdfUrl: record.pdf_url,
        emitidoEm: record.emitido_em ? new Date(record.emitido_em) : null,
        emitidoPor: record.emitido_por,
      },
    });
  }

  toPersistence({ entity }: DocumentoToPersistenceParams): DocumentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      paciente_id: entity.pacienteId,
      atendimento_id: entity.atendimentoId,
      profissional_id: entity.profissionalId,
      tipo: entity.tipo.value,
      conteudo: JSON.stringify(entity.conteudo),
      status: entity.status,
      storage_key: entity.storageKey,
      pdf_url: entity.pdfUrl,
      emitido_em: entity.emitidoEm,
      emitido_por: entity.emitidoPor,
    };
  }
}
