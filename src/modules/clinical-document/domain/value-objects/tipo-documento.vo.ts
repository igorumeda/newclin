export type TipoDocumento =
  | 'receita'
  | 'atestado'
  | 'solicitacao_exames'
  | 'declaracao_comparecimento';

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  'receita',
  'atestado',
  'solicitacao_exames',
  'declaracao_comparecimento',
];

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  receita: 'Receita',
  atestado: 'Atestado',
  solicitacao_exames: 'Solicitação de exames',
  declaracao_comparecimento: 'Declaração de comparecimento',
};

export const TIPO_DOCUMENTO_DESCRICOES: Record<TipoDocumento, string> = {
  receita: 'Prescrição de medicamentos para o paciente.',
  atestado: 'Comprovação de afastamento com CID e período.',
  solicitacao_exames: 'Pedido de exames complementares.',
  declaracao_comparecimento: 'Comprova a presença do paciente no atendimento.',
};

export const TIPO_DOCUMENTO_PREFIXOS: Record<TipoDocumento, string> = {
  receita: 'REC',
  atestado: 'ATE',
  solicitacao_exames: 'SOL',
  declaracao_comparecimento: 'DEC',
};

/**
 * Declaração de comparecimento é o único documento que a recepção pode emitir
 * (§2.4) — os demais exigem profissional ou gestão.
 */
export const TIPOS_DOCUMENTO_RECEPCAO: TipoDocumento[] = ['declaracao_comparecimento'];

export const STATUS_DOCUMENTO_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  emitido: 'Emitido',
  cancelado: 'Cancelado',
};

export function isTipoDocumento(valor: string): valor is TipoDocumento {
  return TIPOS_DOCUMENTO.includes(valor as TipoDocumento);
}
