import type { Documento } from '../entities/documento.entity';
import type { TipoDocumentoValue } from '../value-objects/tipo-documento.vo';

export type BuscarDocumentoParams = { redeId: string; id: string };
export type ListarDocumentosParams = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  tipo?: TipoDocumentoValue | null;
  limite?: number;
};

export interface IDocumentoRepository {
  buscarPorId(params: BuscarDocumentoParams): Promise<Documento | null>;
  listar(params: ListarDocumentosParams): Promise<Documento[]>;
  salvar(documento: Documento): Promise<void>;
  atualizar(documento: Documento): Promise<void>;
}

export const DOCUMENTO_REPOSITORY = Symbol('IDocumentoRepository');
