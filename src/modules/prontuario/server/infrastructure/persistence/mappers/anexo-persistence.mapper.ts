import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Anexo } from '../../../../domain/entities/anexo.entity';
import type { AnexoModel, AnexoModelData } from '../models/anexo.model';

export type AnexoToDomainParams = ToDomainParams<AnexoModel>;
export type AnexoToPersistenceParams = ToPersistenceParams<Anexo>;

export class AnexoPersistenceMapper extends PersistenceMapper<Anexo, AnexoModel, AnexoModelData> {
  toDomain({ record }: AnexoToDomainParams): Anexo {
    return Anexo.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.created_at },
      props: {
        redeId: record.rede_id,
        pacienteId: record.paciente_id,
        atendimentoId: record.atendimento_id,
        nomeArquivo: record.nome_arquivo,
        mimeType: record.mime_type,
        tamanhoBytes: Number(record.tamanho_bytes),
        storageKey: record.storage_key,
        descricao: record.descricao,
        enviadoPor: record.enviado_por,
      },
    });
  }

  toPersistence({ entity }: AnexoToPersistenceParams): AnexoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      paciente_id: entity.pacienteId,
      atendimento_id: entity.atendimentoId,
      nome_arquivo: entity.nomeArquivo,
      mime_type: entity.mimeType,
      tamanho_bytes: entity.tamanhoBytes,
      storage_key: entity.storageKey,
      descricao: entity.descricao,
      enviado_por: entity.enviadoPor,
    };
  }
}
