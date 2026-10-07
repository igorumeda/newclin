import type {
  ArmazenarArquivoParams,
  ArquivoArmazenado,
  IArmazenamentoProvider,
  UrlAssinadaParams,
} from '../../../domain/services/armazenamento-provider.interface';

export abstract class ArmazenamentoProvider implements IArmazenamentoProvider {
  abstract armazenar(params: ArmazenarArquivoParams): Promise<ArquivoArmazenado>;
  abstract urlAssinada(params: UrlAssinadaParams): Promise<string>;
}
