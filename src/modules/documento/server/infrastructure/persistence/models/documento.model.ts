import type { ConteudoDocumento } from '../../../../domain/entities/documento.entity';

export type DocumentoModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  paciente_id: string;
  atendimento_id: string | null;
  profissional_id: string;
  tipo: string;
  conteudo: ConteudoDocumento;
  status: string;
  storage_key: string | null;
  pdf_url: string | null;
  emitido_em: Date | null;
  emitido_por: string | null;
  created_at: Date;
  updated_at: Date;
};

export type DocumentoModelData = {
  id: string;
  rede_id: string;
  unidade_id: string;
  paciente_id: string;
  atendimento_id: string | null;
  profissional_id: string;
  tipo: string;
  conteudo: string;
  status: string;
  storage_key: string | null;
  pdf_url: string | null;
  emitido_em: Date | null;
  emitido_por: string | null;
};
