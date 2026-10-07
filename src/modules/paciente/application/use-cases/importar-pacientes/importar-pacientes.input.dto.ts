export type LinhaImportacaoDto = Record<string, string>;

/** Mapeia o campo do sistema (chave) para o nome da coluna da planilha (valor). */
export type MapeamentoColunasDto = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo?: string;
  telefone?: string;
  email?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  observacoes?: string;
};

export type ImportarPacientesInputDto = {
  redeId: string;
  usuarioId: string | null;
  arquivoNome: string;
  mapeamento: MapeamentoColunasDto;
  linhas: LinhaImportacaoDto[];
  consentimentoLgpd?: boolean;
};
