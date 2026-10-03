export type AtualizarUsuarioInputDto = {
  usuarioId: string;
  nome?: string;
  telefone?: string | null;
  role?: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
};
