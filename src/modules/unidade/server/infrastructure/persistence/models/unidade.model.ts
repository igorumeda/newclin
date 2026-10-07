export type UnidadeModel = {
  id: string;
  rede_id: string;
  nome: string;
  codigo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: Record<string, string>;
  fuso_horario: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type UnidadeModelData = {
  id: string;
  rede_id: string;
  nome: string;
  codigo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string;
  fuso_horario: string;
  ativo: boolean;
};
