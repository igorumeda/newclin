export type AtualizarUsuarioInputDto = {
  redeId: string;
  id: string;
  nome?: string;
  email?: string;
  role?: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  telefone?: string | null;
};
