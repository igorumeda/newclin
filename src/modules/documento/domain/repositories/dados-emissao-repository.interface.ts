import type {
  CabecalhoDocumentoPdf,
  PacienteDocumentoPdf,
  ProfissionalDocumentoPdf,
} from '../services/gerador-pdf-provider.interface';

export type DadosEmissaoDocumento = {
  cabecalho: CabecalhoDocumentoPdf;
  paciente: PacienteDocumentoPdf;
  profissional: ProfissionalDocumentoPdf;
};

export type ObterDadosEmissaoParams = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
};

/** Projeção de leitura usada apenas para compor o cabeçalho do PDF. */
export interface IDadosEmissaoRepository {
  obter(params: ObterDadosEmissaoParams): Promise<DadosEmissaoDocumento | null>;
}

export const DADOS_EMISSAO_REPOSITORY = Symbol('IDadosEmissaoRepository');
