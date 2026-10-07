import type {
  DocumentoPdfGerado,
  GerarDocumentoPdfParams,
  IGeradorPdfProvider,
} from '../../../domain/services/gerador-pdf-provider.interface';

export abstract class GeradorPdfProvider implements IGeradorPdfProvider {
  abstract gerar(params: GerarDocumentoPdfParams): Promise<DocumentoPdfGerado>;
}
