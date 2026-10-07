import type { ConteudoDocumento } from '../../../domain/entities/documento.entity';

export type EmitirDocumentoInputDto = {
  redeId: string;
  id: string;
  conteudo?: ConteudoDocumento;
  emitidoPor?: string | null;
};
