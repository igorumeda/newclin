export type SituacaoImportacao = 'importado' | 'ignorado' | 'erro';

export type DetalheImportacao = {
  linha: number;
  nome: string;
  situacao: SituacaoImportacao;
  mensagem: string;
};

export type RelatorioImportacao = {
  arquivoNome: string;
  total: number;
  importados: number;
  ignorados: number;
  erros: number;
  detalhes: DetalheImportacao[];
};

export type RegistrarImportacaoParams = {
  redeId: string;
  usuarioId: string | null;
  relatorio: RelatorioImportacao;
};
export type ListarImportacoesParams = { redeId: string; limite?: number };
export type ImportacaoResumo = {
  id: string;
  arquivoNome: string;
  total: number;
  importados: number;
  ignorados: number;
  erros: number;
  criadoEm: string;
};

export interface IImportacaoPacientesRepository {
  registrar(params: RegistrarImportacaoParams): Promise<void>;
  listar(params: ListarImportacoesParams): Promise<ImportacaoResumo[]>;
}

export const IMPORTACAO_PACIENTES_REPOSITORY = Symbol('IImportacaoPacientesRepository');
