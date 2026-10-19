import type { CampoEstrutura } from './campo-template.vo';

/**
 * Campos fixos do prontuário (§3.5): presentes em todo atendimento,
 * independentemente do template escolhido.
 */
export const CAMPOS_FIXOS: CampoEstrutura[] = [
  {
    id: 'queixaPrincipal',
    rotulo: 'Queixa principal',
    tipo: 'texto_longo',
    obrigatorio: true,
    ordem: 1,
    ajuda: 'Motivo da consulta nas palavras do paciente.',
  },
  {
    id: 'anamnese',
    rotulo: 'Anamnese',
    tipo: 'texto_longo',
    obrigatorio: true,
    ordem: 2,
  },
  {
    id: 'exameFisico',
    rotulo: 'Exame físico',
    tipo: 'texto_longo',
    obrigatorio: false,
    ordem: 3,
  },
  {
    id: 'hipoteseDiagnostica',
    rotulo: 'Hipótese diagnóstica',
    tipo: 'texto_longo',
    obrigatorio: false,
    ordem: 4,
  },
  {
    id: 'cid',
    rotulo: 'CID-10',
    tipo: 'texto_curto',
    obrigatorio: false,
    ordem: 5,
    placeholder: 'Ex.: J11.1',
    ajuda: 'Código da Classificação Internacional de Doenças.',
  },
  {
    id: 'conduta',
    rotulo: 'Conduta',
    tipo: 'texto_longo',
    obrigatorio: true,
    ordem: 6,
  },
];

export function camposFixosPadrao(): CampoEstrutura[] {
  return CAMPOS_FIXOS.map((campo) => ({ ...campo }));
}

export type CamposFixosChave =
  | 'queixaPrincipal'
  | 'anamnese'
  | 'exameFisico'
  | 'hipoteseDiagnostica'
  | 'cid'
  | 'conduta';

export const CAMPOS_FIXOS_OBRIGATORIOS: CamposFixosChave[] = ['queixaPrincipal', 'anamnese', 'conduta'];
