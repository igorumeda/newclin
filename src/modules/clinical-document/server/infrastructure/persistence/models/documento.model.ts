import type { ConteudoDocumento } from '../../../../domain/value-objects/conteudo-documento.vo';

export type DocumentoModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  paciente_id: string;
  atendimento_id: string | null;
  profissional_id: string;
  tipo: string;
  numero: number;
  conteudo: ConteudoDocumento;
  status: string;
  storage_bucket: string;
  storage_path: string | null;
  emitido_em: string | null;
  emitido_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DocumentoModelData = {
  id: string;
  rede_id: string;
  unidade_id: string;
  paciente_id: string;
  atendimento_id: string | null;
  profissional_id: string;
  tipo: string;
  numero: number;
  conteudo: ConteudoDocumento;
  status: string;
  storage_bucket: string;
  storage_path: string | null;
  emitido_em: string | null;
  emitido_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  created_by: string | null;
};

export const DOCUMENTO_COLUMNS =
  'id, rede_id, unidade_id, paciente_id, atendimento_id, profissional_id, tipo, numero, conteudo, status, storage_bucket, storage_path, emitido_em, emitido_por, cancelado_em, motivo_cancelamento, created_by, created_at, updated_at, deleted_at';

export type ProfissionalDocumentoModel = {
  id: string;
  rede_id: string;
  nome: string;
  especialidade: string;
  conselho_classe: string | null;
  numero_conselho: string | null;
  uf_conselho: string | null;
};
