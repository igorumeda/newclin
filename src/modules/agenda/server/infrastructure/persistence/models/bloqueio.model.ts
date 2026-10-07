export type BloqueioModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  profissional_id: string | null;
  motivo: string;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  criado_por: string | null;
  created_at: Date;
  updated_at: Date;
};

export type BloqueioModelData = {
  id: string;
  rede_id: string;
  unidade_id: string;
  profissional_id: string | null;
  motivo: string;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  criado_por: string | null;
};
