export type UsuarioModel = {
  id: string;
  rede_id: string;
  nome: string;
  email: string;
  senha_hash: string;
  role: string;
  profissional_id: string | null;
  telefone: string | null;
  avatar_url: string | null;
  ativo: boolean;
  ultimo_acesso_em: Date | null;
  created_at: Date;
  updated_at: Date;
  unidades_acesso: string[] | null;
};

export type UsuarioModelData = {
  id: string;
  rede_id: string;
  nome: string;
  email: string;
  senha_hash: string;
  role: string;
  profissional_id: string | null;
  telefone: string | null;
  avatar_url: string | null;
  ativo: boolean;
  ultimo_acesso_em: Date | null;
  created_at: Date;
  updated_at: Date;
};
