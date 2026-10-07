import type { ConteudoDocumento, StatusDocumento } from '../../domain/entities/documento.entity';
import type { TipoDocumentoValue } from '../../domain/value-objects/tipo-documento.vo';

export type DocumentoResponseDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  atendimentoId: string | null;
  profissionalId: string;
  tipo: TipoDocumentoValue;
  tipoRotulo: string;
  conteudo: ConteudoDocumento;
  status: StatusDocumento;
  storageKey: string | null;
  pdfUrl: string | null;
  emitidoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};
