export type TipoCampoTemplate =
  | 'texto_curto'
  | 'texto_longo'
  | 'numero'
  | 'data'
  | 'selecao_unica'
  | 'selecao_multipla'
  | 'escala'
  | 'sim_nao'
  | 'anexo';

export const TIPOS_CAMPO: TipoCampoTemplate[] = [
  'texto_curto',
  'texto_longo',
  'numero',
  'data',
  'selecao_unica',
  'selecao_multipla',
  'escala',
  'sim_nao',
  'anexo',
];

export const TIPO_CAMPO_LABELS: Record<TipoCampoTemplate, string> = {
  texto_curto: 'Texto curto',
  texto_longo: 'Texto longo',
  numero: 'Número',
  data: 'Data',
  selecao_unica: 'Seleção única (dropdown)',
  selecao_multipla: 'Múltipla escolha (checkboxes)',
  escala: 'Escala 0–10',
  sim_nao: 'Sim/Não',
  anexo: 'Anexo',
};

/** Definição serializada de um campo do template (persistida em JSONB). */
export type CampoEstrutura = {
  id: string;
  rotulo: string;
  tipo: TipoCampoTemplate;
  obrigatorio?: boolean;
  ordem?: number;
  opcoes?: string[];
  min?: number;
  max?: number;
  placeholder?: string | null;
  ajuda?: string | null;
};

export type CampoEstruturaOpcional = {
  id: string;
  rotulo: string;
  tipo: TipoCampoTemplate | string;
  obrigatorio?: boolean;
  ordem?: number;
  opcoes?: string[];
  min?: number;
  max?: number;
  placeholder?: string | null;
  ajuda?: string | null;
};

export type ValidacaoCampoParams = { campo: CampoEstruturaOpcional };

export function isTipoCampo(valor: string): valor is TipoCampoTemplate {
  return TIPOS_CAMPO.includes(valor as TipoCampoTemplate);
}

/** Um campo precisa de opções nos tipos de seleção e de faixa na escala. */
export function validarCampo(params: ValidacaoCampoParams): string | null {
  const { campo } = params;

  if (!campo.id || !/^[a-z0-9][a-z0-9-_]*$/.test(campo.id)) {
    return `Campo com identificador inválido: "${campo.id ?? ''}" (use letras minúsculas, números e hífen)`;
  }
  if (!campo.rotulo || campo.rotulo.trim().length < 2) {
    return `Campo "${campo.id}" precisa de um rótulo com ao menos 2 caracteres`;
  }
  if (!isTipoCampo(campo.tipo)) {
    return `Campo "${campo.id}" tem tipo inválido: "${campo.tipo}"`;
  }
  if ((campo.tipo === 'selecao_unica' || campo.tipo === 'selecao_multipla') && (!campo.opcoes || campo.opcoes.length < 2)) {
    return `Campo de seleção "${campo.id}" precisa de pelo menos 2 opções`;
  }
  if (campo.tipo === 'escala') {
    const min = campo.min ?? 0;
    const max = campo.max ?? 10;
    if (min >= max) return `Campo de escala "${campo.id}" precisa de um intervalo válido (min < max)`;
  }
  if (campo.tipo === 'numero' && campo.min !== undefined && campo.max !== undefined && campo.min > campo.max) {
    return `Campo numérico "${campo.id}" tem intervalo inválido`;
  }

  return null;
}
