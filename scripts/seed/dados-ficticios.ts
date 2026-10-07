/**
 * Catálogo de dados fictícios usados pelo `scripts/seed.ts`.
 * Nenhum dado real de paciente: tudo aqui é inventado para testes.
 */
export type EspecialidadeSeed = {
  nome: string;
  conselho: string;
  corAgenda: string;
};

export const SENHA_PADRAO = 'Clinica@2025';

export const REDE_SEED = {
  nome: 'Rede Saúde Viva',
  slug: 'saude-viva',
  cnpj: '12345678000190',
  preset: 'azul_saude',
};

export const UNIDADES_SEED = [
  {
    nome: 'Unidade Centro',
    codigo: 'UC-01',
    telefone: '1133220011',
    email: 'centro@saudeviva.com.br',
    logradouro: 'Rua das Acácias',
    numero: '120',
    bairro: 'Centro',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01010000',
    fusoHorario: 'America/Sao_Paulo',
  },
  {
    nome: 'Unidade Zona Norte',
    codigo: 'UZN-02',
    telefone: '1133220022',
    email: 'norte@saudeviva.com.br',
    logradouro: 'Avenida das Palmeiras',
    numero: '880',
    bairro: 'Santana',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '02040000',
    fusoHorario: 'America/Sao_Paulo',
  },
  {
    nome: 'Unidade Litoral',
    codigo: 'UL-03',
    telefone: '1333220033',
    email: 'litoral@saudeviva.com.br',
    logradouro: 'Rua do Farol',
    numero: '45',
    bairro: 'Boqueirão',
    cidade: 'Santos',
    uf: 'SP',
    cep: '11045000',
    fusoHorario: 'America/Sao_Paulo',
  },
];

export const ESPECIALIDADES_SEED: EspecialidadeSeed[] = [
  { nome: 'Clínica Geral', conselho: 'CRM', corAgenda: '#0ea5e9' },
  { nome: 'Pediatria', conselho: 'CRM', corAgenda: '#22c55e' },
  { nome: 'Ginecologia', conselho: 'CRM', corAgenda: '#ec4899' },
  { nome: 'Ortopedia', conselho: 'CRM', corAgenda: '#f59e0b' },
  { nome: 'Dermatologia', conselho: 'CRM', corAgenda: '#8b5cf6' },
  { nome: 'Cardiologia', conselho: 'CRM', corAgenda: '#ef4444' },
  { nome: 'Psiquiatria', conselho: 'CRM', corAgenda: '#14b8a6' },
];

export const PROFISSIONAIS_SEED = [
  { nome: 'Dra. Helena Marques', especialidade: 'Clínica Geral', numeroConselho: '101101' },
  { nome: 'Dr. Rafael Nogueira', especialidade: 'Pediatria', numeroConselho: '102202' },
  { nome: 'Dra. Camila Ferraz', especialidade: 'Ginecologia', numeroConselho: '103303' },
  { nome: 'Dr. Bruno Tavares', especialidade: 'Ortopedia', numeroConselho: '104404' },
  { nome: 'Dra. Patrícia Lemos', especialidade: 'Dermatologia', numeroConselho: '105505' },
  { nome: 'Dr. Vicente Almeida', especialidade: 'Cardiologia', numeroConselho: '106606' },
  { nome: 'Dra. Sofia Brandão', especialidade: 'Psiquiatria', numeroConselho: '107707' },
];

export const TIPOS_ATENDIMENTO_SEED = [
  { nome: 'Primeira consulta', duracaoMinutos: 45, cor: '#0ea5e9' },
  { nome: 'Consulta de rotina', duracaoMinutos: 30, cor: '#22c55e' },
  { nome: 'Retorno', duracaoMinutos: 20, cor: '#a855f7' },
  { nome: 'Procedimento ambulatorial', duracaoMinutos: 60, cor: '#f59e0b' },
  { nome: 'Teleconsulta', duracaoMinutos: 30, cor: '#14b8a6' },
];

export const NOMES_PACIENTES = [
  'Ana Clara Souza', 'Bruno Henrique Lima', 'Carla Mendes Rocha', 'Daniel Figueiredo',
  'Eduarda Prado', 'Fábio Antunes', 'Gabriela Martins', 'Henrique Barbosa',
  'Isabela Cardoso', 'João Pedro Ramos', 'Karina Oliveira', 'Lucas Teixeira',
  'Mariana Castro', 'Nicolas Ferreira', 'Olívia Barros', 'Paulo Vinícius Moura',
  'Queila Santana', 'Rodrigo Peixoto', 'Sabrina Dourado', 'Thiago Carvalho',
  'Úrsula Beltrão', 'Vanessa Quintela', 'Wesley Aragão', 'Xênia Moraes',
  'Yago Pimentel', 'Zilda Nogueira', 'Alice Bonfim', 'Bernardo Vasques',
  'Cecília Andrade', 'Davi Lucca Freitas', 'Elisa Monteiro', 'Fernando Goulart',
  'Giovana Pires', 'Heitor Sampaio', 'Ingrid Vasconcelos', 'Jonas Siqueira',
];

export const BAIRROS_SEED = ['Centro', 'Santana', 'Vila Mariana', 'Boqueirão', 'Tatuapé', 'Pinheiros'];
export const ALERGIAS_SEED = ['Dipirona', 'Penicilina', 'Látex', 'Frutos do mar', 'Poeira'];
export const CONDICOES_SEED = ['Hipertensão', 'Diabetes tipo 2', 'Asma', 'Hipotireoidismo', 'Enxaqueca'];

export const QUEIXAS_SEED = [
  'Dor de cabeça persistente há 5 dias',
  'Tosse seca e febre baixa',
  'Dor lombar após esforço físico',
  'Lesão de pele com prurido',
  'Palpitações e cansaço aos esforços',
  'Revisão de rotina e exames periódicos',
  'Ansiedade e insônia recorrentes',
];

export const CONDUTAS_SEED = [
  'Prescrição de analgésico e reavaliação em 7 dias',
  'Solicitação de hemograma completo e retorno com resultado',
  'Fisioterapia por 4 semanas e orientações posturais',
  'Uso de corticoide tópico por 10 dias',
  'Encaminhamento para ecocardiograma',
  'Manutenção do tratamento atual; retorno em 6 meses',
  'Início de psicoterapia semanal e reavaliação mensal',
];

export const MOTIVOS_CANCELAMENTO = [
  'Paciente solicitou cancelamento',
  'Profissional indisponível',
  'Conflito de agenda do paciente',
];
