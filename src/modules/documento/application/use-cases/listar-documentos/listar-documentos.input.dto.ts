import type { TipoDocumentoValue } from '../../../domain/value-objects/tipo-documento.vo';

export type ListarDocumentosInputDto = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  tipo?: TipoDocumentoValue | null;
  limite?: number;
};
