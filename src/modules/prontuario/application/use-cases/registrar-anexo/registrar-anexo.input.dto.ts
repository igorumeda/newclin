export type RegistrarAnexoInputDto = {
  redeId: string;
  pacienteId: string;
  atendimentoId?: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageKey: string;
  descricao?: string | null;
  enviadoPor?: string | null;
};
