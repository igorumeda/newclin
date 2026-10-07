import type { TipoDocumentoValue } from '../value-objects/tipo-documento.vo';
import type { ConteudoDocumento } from '../entities/documento.entity';

export type CabecalhoDocumentoPdf = {
  redeNome: string;
  redeLogoUrl: string | null;
  unidadeNome: string;
  unidadeEndereco: string;
  unidadeTelefone: string | null;
};

export type PacienteDocumentoPdf = {
  nome: string;
  cpf: string;
  dataNascimento: string;
};

export type ProfissionalDocumentoPdf = {
  nome: string;
  conselho: string;
  numeroConselho: string;
  ufConselho: string;
  especialidade: string;
};

export type GerarDocumentoPdfParams = {
  tipo: TipoDocumentoValue;
  titulo: string;
  cabecalho: CabecalhoDocumentoPdf;
  paciente: PacienteDocumentoPdf;
  profissional: ProfissionalDocumentoPdf;
  conteudo: ConteudoDocumento;
  emitidoEm: Date;
  codigoVerificacao: string;
};

export type DocumentoPdfGerado = { conteudo: Uint8Array; mimeType: string };

export interface IGeradorPdfProvider {
  gerar(params: GerarDocumentoPdfParams): Promise<DocumentoPdfGerado>;
}

export const GERADOR_PDF_PROVIDER = Symbol('IGeradorPdfProvider');
