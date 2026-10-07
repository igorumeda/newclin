export type ListarAtendimentosInputDto = {
  redeId: string;
  pacienteId?: string | null;
  profissionalId?: string | null;
  unidadeId?: string | null;
  pagina?: number;
  porPagina?: number;
};
