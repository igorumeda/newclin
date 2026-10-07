export type TipoAtendimentoModel = {
  id: string;
  rede_id: string;
  nome: string;
  duracao_minutos: number;
  cor: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TipoAtendimentoModelData = {
  id: string;
  rede_id: string;
  nome: string;
  duracao_minutos: number;
  cor: string;
  ativo: boolean;
};
