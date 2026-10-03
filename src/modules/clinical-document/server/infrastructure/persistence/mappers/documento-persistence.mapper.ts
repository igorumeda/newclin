import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Documento } from '../../../../domain/entities/documento.entity';
import type { StatusDocumento } from '../../../../domain/entities/documento.entity';
import { ConteudoDocumentoVO } from '../../../../domain/value-objects/conteudo-documento.vo';
import type { TipoDocumento } from '../../../../domain/value-objects/tipo-documento.vo';
import type { DocumentoModel, DocumentoModelData } from '../models/documento.model';

export class DocumentoPersistenceMapper extends PersistenceMapper<
  Documento,
  DocumentoModel,
  DocumentoModelData
> {
  public toDomain({ record }: ToDomainParams<DocumentoModel>): Documento {
    return Documento.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        pacienteId: record.paciente_id,
        atendimentoId: record.atendimento_id,
        profissionalId: record.profissional_id,
        tipo: record.tipo as TipoDocumento,
        numero: Number(record.numero),
        conteudo: ConteudoDocumentoVO.reconstitute(record.conteudo ?? {}),
        status: record.status as StatusDocumento,
        storageBucket: record.storage_bucket,
        storagePath: record.storage_path,
        emitidoEm: record.emitido_em ? new Date(record.emitido_em) : null,
        emitidoPor: record.emitido_por,
        canceladoEm: record.cancelado_em ? new Date(record.cancelado_em) : null,
        motivoCancelamento: record.motivo_cancelamento,
        createdBy: record.created_by,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Documento>): DocumentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      paciente_id: entity.pacienteId,
      atendimento_id: entity.atendimentoId,
      profissional_id: entity.profissionalId,
      tipo: entity.tipo,
      numero: entity.numero,
      conteudo: entity.conteudo.toJSON(),
      status: entity.status,
      storage_bucket: entity.storageBucket,
      storage_path: entity.storagePath,
      emitido_em: entity.emitidoEm ? entity.emitidoEm.toISOString() : null,
      emitido_por: entity.emitidoPor,
      cancelado_em: entity.canceladoEm ? entity.canceladoEm.toISOString() : null,
      motivo_cancelamento: entity.motivoCancelamento,
      created_by: entity.createdBy,
    };
  }
}
