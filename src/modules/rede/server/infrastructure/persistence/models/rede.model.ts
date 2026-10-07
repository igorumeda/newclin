export type RedeModel = {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  logotipo_url: string | null;
  tema: Record<string, unknown>;
  config: Record<string, unknown>;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type RedeModelData = {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  logotipo_url: string | null;
  tema: string;
  config: string;
  ativo: boolean;
};
