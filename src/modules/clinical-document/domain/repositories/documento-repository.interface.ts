import type { Documento, StatusDocumento } from '../entities/documento.entity';
import type { TipoDocumento } from '../value-objects/tipo-documento.vo';

export type DocumentoId = string;

export type ListarDocumentosFiltro = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  profissionalId?: string | null;
  unidadeId?: string | null;
  tipo?: TipoDocumento | null;
  status?: StatusDocumento[] | null;
  de?: string | null;
  ate?: string | null;
  page?: number;
  perPage?: number;
};

export type ListarDocumentosResultado = {
  items: Documento[];
  total: number;
};

export interface IDocumentoRepository {
  findById(id: DocumentoId): Promise<Documento | null>;
  listar(filtro: ListarDocumentosFiltro): Promise<ListarDocumentosResultado>;
  save(documento: Documento): Promise<void>;
  update(documento: Documento): Promise<void>;
  /** Último número atribuído por tipo — usado para numerar rascunhos na UI. */
  proximoNumero(params: { redeId: string; tipo: TipoDocumento }): Promise<number>;
}

export const DOCUMENTO_REPOSITORY = Symbol('IDocumentoRepository');
