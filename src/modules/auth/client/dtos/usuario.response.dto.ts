/** Contratos de resposta HTTP consumidos pelo client (não importam `application/`). */
export type UsuarioResponseDto = {
  id: string;
  redeId: string;
  nome: string;
  email: string;
  role: string;
  rotuloRole: string;
  permissoes: string[];
  unidadesAcesso: string[];
  profissionalId: string | null;
  telefone: string | null;
  avatarUrl: string | null;
  ativo: boolean;
  ultimoAcessoEm: string | null;
  criadoEm: string;
};

export type SessaoResponseDto = {
  token: string;
  expiraEm: string;
  usuario: UsuarioResponseDto;
};
