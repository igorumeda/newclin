export type UsuarioOutputDto = {
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
