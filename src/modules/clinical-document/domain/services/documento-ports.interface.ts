import type { ConteudoDocumento } from '../value-objects/conteudo-documento.vo';
import type { TipoDocumento } from '../value-objects/tipo-documento.vo';

export type CabecalhoDocumento = {
  redeNome: string;
  unidadeNome: string;
  unidadeEndereco: string;
  unidadeTelefone: string;
  logotipoUrl: string | null;
};

export type PacienteDocumento = {
  nome: string;
  cpfFormatado: string;
  dataNascimento: string;
  idade: number;
  sexoLabel: string;
};

export type ProfissionalDocumento = {
  nome: string;
  especialidade: string;
  conselhoClasse: string | null;
  numeroConselho: string | null;
};

export type GerarDocumentoPdfParams = {
  documentoId: string;
  tipo: TipoDocumento;
  numero: number;
  emitidoEm: Date;
  cabecalho: CabecalhoDocumento;
  paciente: PacienteDocumento;
  profissional: ProfissionalDocumento;
  conteudo: ConteudoDocumento;
  /** Rodapé do atestado/declaração (ex.: "Documento emitido eletronicamente"). */
  observacoes?: string | null;
};

export type DocumentoPdfGerado = {
  bytes: Uint8Array;
  nomeArquivo: string;
  mimeType: string;
};

/** Geração do PDF do documento clínico (§3.6) — implementado com pdf-lib. */
export interface IDocumentoPdf {
  gerar(params: GerarDocumentoPdfParams): Promise<DocumentoPdfGerado>;
}

export const DOCUMENTO_PDF = Symbol('IDocumentoPdf');

export type UploadDocumentoParams = {
  caminho: string;
  conteudo: Uint8Array;
  mimeType: string;
};

/** Armazenamento dos PDFs emitidos no bucket privado `documentos` (§4.3). */
export interface IDocumentoStorage {
  upload(params: UploadDocumentoParams): Promise<{ bucket: string; caminho: string }>;
  urlAssinada(params: { caminho: string; expiraEmSegundos?: number }): Promise<string | null>;
  remover(params: { caminho: string }): Promise<void>;
}

export const DOCUMENTO_STORAGE = Symbol('IDocumentoStorage');
