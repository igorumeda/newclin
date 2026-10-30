export type AtualizarUsuarioInputDto = {
  usuarioId: string;
  solicitanteRedeId?: string | null;
  nome?: string;
  telefone?: string | null;
  role?: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
};
