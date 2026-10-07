export type ArmazenarArquivoParams = {
  chave: string;
  conteudo: Uint8Array;
  mimeType: string;
};
export type UrlAssinadaParams = { chave: string; expiraEmSegundos?: number };
export type ArquivoArmazenado = { chave: string; url: string | null };

/** Porta de armazenamento de arquivos (local ou S3) usada na emissão de PDFs. */
export interface IArmazenamentoProvider {
  armazenar(params: ArmazenarArquivoParams): Promise<ArquivoArmazenado>;
  urlAssinada(params: UrlAssinadaParams): Promise<string>;
}

export const ARMAZENAMENTO_PROVIDER = Symbol('IArmazenamentoProvider');
