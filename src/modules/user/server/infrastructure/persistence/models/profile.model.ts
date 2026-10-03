/** Modelo de persistência da tabela `profiles`. Nunca é usado como entidade de domínio. */
export type ProfileModel = {
  id: string;
  auth_user_id: string | null;
  rede_id: string;
  nome: string;
  email: string;
  role: string;
  telefone: string | null;
  unidades_acesso: string[] | null;
  profissional_id: string | null;
  ativo: boolean;
  ultimo_acesso_em: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProfileModelData = {
  id: string;
  auth_user_id: string | null;
  rede_id: string;
  nome: string;
  email: string;
  role: string;
  telefone: string | null;
  unidades_acesso: string[];
  profissional_id: string | null;
  ativo: boolean;
  ultimo_acesso_em: string | null;
};

export const PROFILE_COLUMNS =
  'id, auth_user_id, rede_id, nome, email, role, telefone, unidades_acesso, profissional_id, ativo, ultimo_acesso_em, created_at, updated_at, deleted_at';
