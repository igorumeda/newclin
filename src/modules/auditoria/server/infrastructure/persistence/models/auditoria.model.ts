export type AuditoriaModel = {
  id: string;
  rede_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  unidade_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  descricao: string | null;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
};

export type AuditoriaModelData = {
  id: string;
  rede_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  unidade_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  descricao: string | null;
  dados_antes: string | null;
  dados_depois: string | null;
  ip: string | null;
  user_agent: string | null;
};
