export type AnexoOutputDto = {
  id: string;
  redeId: string;
  pacienteId: string;
  atendimentoId: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageKey: string;
  descricao: string | null;
  criadoEm: string;
};
