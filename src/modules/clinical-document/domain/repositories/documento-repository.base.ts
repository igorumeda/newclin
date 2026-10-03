import type { Documento } from '../entities/documento.entity';
import type { TipoDocumento } from '../value-objects/tipo-documento.vo';
import type {
  DocumentoId,
  IDocumentoRepository,
  ListarDocumentosFiltro,
  ListarDocumentosResultado,
} from './documento-repository.interface';

export abstract class DocumentoRepository implements IDocumentoRepository {
  abstract findById(id: DocumentoId): Promise<Documento | null>;
  abstract listar(filtro: ListarDocumentosFiltro): Promise<ListarDocumentosResultado>;
  abstract save(documento: Documento): Promise<void>;
  abstract update(documento: Documento): Promise<void>;
  abstract proximoNumero(params: { redeId: string; tipo: TipoDocumento }): Promise<number>;
}
