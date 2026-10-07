export type AnexoModel = {
  id: string;
  rede_id: string;
  paciente_id: string;
  atendimento_id: string | null;
  nome_arquivo: string;
  mime_type: string;
  tamanho_bytes: string | number;
  storage_key: string;
  descricao: string | null;
  enviado_por: string | null;
  created_at: Date;
};

export type AnexoModelData = {
  id: string;
  rede_id: string;
  paciente_id: string;
  atendimento_id: string | null;
  nome_arquivo: string;
  mime_type: string;
  tamanho_bytes: number;
  storage_key: string;
  descricao: string | null;
  enviado_por: string | null;
};
