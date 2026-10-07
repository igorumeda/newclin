import type { Documento } from '../entities/documento.entity';
import type {
  BuscarDocumentoParams,
  IDocumentoRepository,
  ListarDocumentosParams,
} from './documento-repository.interface';

export abstract class DocumentoRepository implements IDocumentoRepository {
  abstract buscarPorId(params: BuscarDocumentoParams): Promise<Documento | null>;
  abstract listar(params: ListarDocumentosParams): Promise<Documento[]>;
  abstract salvar(documento: Documento): Promise<void>;
  abstract atualizar(documento: Documento): Promise<void>;
}
