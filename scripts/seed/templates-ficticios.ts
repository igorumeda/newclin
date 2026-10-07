/** Templates de prontuário por especialidade (cobrem os 9 tipos de campo). */
export type CampoSeed = {
  id: string;
  rotulo: string;
  tipo: string;
  obrigatorio: boolean;
  valorPadrao: string | null;
  opcoes: string[];
  ajuda: string | null;
};

export type SecaoSeed = { id: string; titulo: string; ordem: number; campos: CampoSeed[] };
export type TemplateSeed = {
  nome: string;
  especialidade: string;
  descricao: string;
  secoes: SecaoSeed[];
};

type CampoParcial = {
  id: string;
  rotulo: string;
  tipo: string;
  obrigatorio?: boolean;
  valorPadrao?: string | null;
  opcoes?: string[];
  ajuda?: string | null;
};

function campo(dados: CampoParcial): CampoSeed {
  return {
    id: dados.id,
    rotulo: dados.rotulo,
    tipo: dados.tipo,
    obrigatorio: dados.obrigatorio ?? false,
    valorPadrao: dados.valorPadrao ?? null,
    opcoes: dados.opcoes ?? [],
    ajuda: dados.ajuda ?? null,
  };
}

const SINAIS_VITAIS: SecaoSeed = {
  id: 'sinais_vitais',
  titulo: 'Sinais vitais',
  ordem: 1,
  campos: [
    campo({ id: 'sinais_vitais__pa', rotulo: 'Pressão arterial (mmHg)', tipo: 'texto_curto' }),
    campo({ id: 'sinais_vitais__fc', rotulo: 'Frequência cardíaca (bpm)', tipo: 'numero' }),
    campo({ id: 'sinais_vitais__temp', rotulo: 'Temperatura (°C)', tipo: 'numero' }),
    campo({ id: 'sinais_vitais__peso', rotulo: 'Peso (kg)', tipo: 'numero' }),
    campo({ id: 'sinais_vitais__altura', rotulo: 'Altura (cm)', tipo: 'numero' }),
  ],
};

export const TEMPLATES_SEED: TemplateSeed[] = [
  {
    nome: 'Consulta de clínica geral',
    especialidade: 'Clínica Geral',
    descricao: 'Modelo padrão para consultas gerais.',
    secoes: [
      SINAIS_VITAIS,
      {
        id: 'avaliacao',
        titulo: 'Avaliação',
        ordem: 2,
        campos: [
          campo({
            id: 'avaliacao__dor',
            rotulo: 'Intensidade da dor',
            tipo: 'escala',
            ajuda: 'Escala de 1 a 10',
          }),
          campo({
            id: 'avaliacao__tabagismo',
            rotulo: 'Tabagista?',
            tipo: 'sim_nao',
            obrigatorio: true,
          }),
          campo({
            id: 'avaliacao__habitos',
            rotulo: 'Hábitos de vida',
            tipo: 'selecao_multipla',
            opcoes: ['Atividade física regular', 'Alimentação balanceada', 'Sono adequado', 'Etilismo'],
          }),
          campo({ id: 'avaliacao__obs', rotulo: 'Observações clínicas', tipo: 'texto_longo' }),
        ],
      },
    ],
  },
  {
    nome: 'Consulta pediátrica',
    especialidade: 'Pediatria',
    descricao: 'Acompanhamento de crescimento e desenvolvimento.',
    secoes: [
      SINAIS_VITAIS,
      {
        id: 'desenvolvimento',
        titulo: 'Desenvolvimento',
        ordem: 2,
        campos: [
          campo({
            id: 'desenvolvimento__aleitamento',
            rotulo: 'Aleitamento',
            tipo: 'selecao_unica',
            opcoes: ['Exclusivo', 'Misto', 'Fórmula', 'Não se aplica'],
            obrigatorio: true,
          }),
          campo({ id: 'desenvolvimento__vacinas', rotulo: 'Vacinas em dia?', tipo: 'sim_nao' }),
          campo({
            id: 'desenvolvimento__caderneta',
            rotulo: 'Caderneta da criança',
            tipo: 'anexo',
            ajuda: 'PDF, JPG ou PNG de até 10 MB',
          }),
          campo({ id: 'desenvolvimento__marcos', rotulo: 'Marcos do desenvolvimento', tipo: 'texto_longo' }),
        ],
      },
    ],
  },
  {
    nome: 'Consulta ginecológica',
    especialidade: 'Ginecologia',
    descricao: 'Saúde da mulher e rastreamento.',
    secoes: [
      SINAIS_VITAIS,
      {
        id: 'historico',
        titulo: 'Histórico ginecológico',
        ordem: 2,
        campos: [
          campo({ id: 'historico__dum', rotulo: 'Data da última menstruação', tipo: 'data' }),
          campo({ id: 'historico__gestacoes', rotulo: 'Número de gestações', tipo: 'numero' }),
          campo({
            id: 'historico__metodo',
            rotulo: 'Método contraceptivo',
            tipo: 'selecao_unica',
            opcoes: ['Nenhum', 'Oral', 'DIU', 'Implante', 'Preservativo'],
          }),
          campo({ id: 'historico__preventivo', rotulo: 'Preventivo em dia?', tipo: 'sim_nao' }),
        ],
      },
    ],
  },
  {
    nome: 'Avaliação ortopédica',
    especialidade: 'Ortopedia',
    descricao: 'Avaliação musculoesquelética.',
    secoes: [
      SINAIS_VITAIS,
      {
        id: 'exame',
        titulo: 'Exame físico dirigido',
        ordem: 2,
        campos: [
          campo({
            id: 'exame__articulacao',
            rotulo: 'Articulação acometida',
            tipo: 'selecao_unica',
            opcoes: ['Joelho', 'Ombro', 'Coluna lombar', 'Tornozelo', 'Punho'],
            obrigatorio: true,
          }),
          campo({ id: 'exame__dor', rotulo: 'Dor em repouso', tipo: 'escala' }),
          campo({ id: 'exame__amplitude', rotulo: 'Amplitude de movimento preservada?', tipo: 'sim_nao' }),
          campo({ id: 'exame__imagem', rotulo: 'Exame de imagem', tipo: 'anexo' }),
        ],
      },
    ],
  },
  {
    nome: 'Consulta dermatológica',
    especialidade: 'Dermatologia',
    descricao: 'Avaliação de lesões de pele.',
    secoes: [
      {
        id: 'lesao',
        titulo: 'Lesão',
        ordem: 1,
        campos: [
          campo({ id: 'lesao__local', rotulo: 'Localização', tipo: 'texto_curto', obrigatorio: true }),
          campo({ id: 'lesao__inicio', rotulo: 'Início dos sintomas', tipo: 'data' }),
          campo({
            id: 'lesao__tipo',
            rotulo: 'Tipo de lesão',
            tipo: 'selecao_multipla',
            opcoes: ['Mácula', 'Pápula', 'Vesícula', 'Placa', 'Nódulo'],
          }),
          campo({ id: 'lesao__foto', rotulo: 'Fotografia da lesão', tipo: 'anexo' }),
          campo({ id: 'lesao__prurido', rotulo: 'Prurido', tipo: 'escala' }),
        ],
      },
    ],
  },
  {
    nome: 'Consulta cardiológica',
    especialidade: 'Cardiologia',
    descricao: 'Avaliação de risco cardiovascular.',
    secoes: [
      SINAIS_VITAIS,
      {
        id: 'risco',
        titulo: 'Risco cardiovascular',
        ordem: 2,
        campos: [
          campo({
            id: 'risco__fatores',
            rotulo: 'Fatores de risco',
            tipo: 'selecao_multipla',
            opcoes: ['Tabagismo', 'Dislipidemia', 'Diabetes', 'Histórico familiar', 'Sedentarismo'],
          }),
          campo({ id: 'risco__dispneia', rotulo: 'Dispneia aos esforços?', tipo: 'sim_nao' }),
          campo({ id: 'risco__ecg', rotulo: 'ECG anexo', tipo: 'anexo' }),
          campo({ id: 'risco__obs', rotulo: 'Conduta detalhada', tipo: 'texto_longo' }),
        ],
      },
    ],
  },
  {
    nome: 'Consulta psiquiátrica',
    especialidade: 'Psiquiatria',
    descricao: 'Avaliação de saúde mental.',
    secoes: [
      {
        id: 'estado_mental',
        titulo: 'Exame do estado mental',
        ordem: 1,
        campos: [
          campo({ id: 'estado_mental__humor', rotulo: 'Humor relatado', tipo: 'escala', obrigatorio: true }),
          campo({ id: 'estado_mental__sono', rotulo: 'Horas de sono por noite', tipo: 'numero' }),
          campo({
            id: 'estado_mental__sintomas',
            rotulo: 'Sintomas presentes',
            tipo: 'selecao_multipla',
            opcoes: ['Ansiedade', 'Tristeza', 'Irritabilidade', 'Anedonia', 'Pensamentos intrusivos'],
          }),
          campo({ id: 'estado_mental__risco', rotulo: 'Risco de autoagressão?', tipo: 'sim_nao' }),
          campo({ id: 'estado_mental__evolucao', rotulo: 'Evolução desde a última consulta', tipo: 'texto_longo' }),
        ],
      },
    ],
  },
];
