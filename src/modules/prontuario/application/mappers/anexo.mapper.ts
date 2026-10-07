import { Mapper } from '@core/application/mapper.base';
import type { Anexo } from '../../domain/entities/anexo.entity';
import type { AnexoOutputDto } from './anexo.output.dto';

export type AnexoMapperParams = { anexo: Anexo };

export class AnexoMapper extends Mapper<AnexoMapperParams, AnexoOutputDto> {
  public map({ anexo }: AnexoMapperParams): AnexoOutputDto {
    return {
      id: anexo.id.toString(),
      redeId: anexo.redeId,
      pacienteId: anexo.pacienteId,
      atendimentoId: anexo.atendimentoId,
      nomeArquivo: anexo.nomeArquivo,
      mimeType: anexo.mimeType,
      tamanhoBytes: anexo.tamanhoBytes,
      storageKey: anexo.storageKey,
      descricao: anexo.descricao,
      criadoEm: anexo.createdAt.toISOString(),
    };
  }
}
