import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CalendarCheck2,
  Clock,
  FileText,
  MessageSquareMore,
  Palette,
  PiggyBank,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Zap,
} from 'lucide-react';

export type CategoriaRecursoLanding =
  | 'todos'
  | 'atendimento'
  | 'clinico'
  | 'gestao';

export type RecursoLanding = {
  id: string;
  titulo: string;
  descricao: string;
  beneficio: string;
  categoria: Exclude<CategoriaRecursoLanding, 'todos'>;
  icone: LucideIcon;
  tag: string;
};

export type IndicadorEconomiaLanding = {
  valor: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

export const CATEGORIAS_RECURSOS: {
  id: CategoriaRecursoLanding;
  rotulo: string;
}[] = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'atendimento', rotulo: 'Agenda & Recepção' },
  { id: 'clinico', rotulo: 'Prontuário & PDF' },
  { id: 'gestao', rotulo: 'Gestão & Marca' },
];

export const INDICADORES_ECONOMIA: IndicadorEconomiaLanding[] = [
  {
    valor: '-40%',
    titulo: 'Menos faltas na agenda',
    descricao:
      'Lembretes automáticos no WhatsApp recuperam horários que seriam perdidos.',
    icone: TrendingUp,
  },
  {
    valor: '15h/sem',
    titulo: 'Economizadas na recepção',
    descricao:
      'Fim das ligações manuais de confirmação e do retrabalho em planilhas.',
    icone: Clock,
  },
  {
    valor: 'R$ 4,5 mil',
    titulo: 'Economia estimada / mês',
    descricao:
      'Redução de custos operacionais, papelada e horários ociosos por unidade.',
    icone: PiggyBank,
  },
  {
    valor: '3x',
    titulo: 'Atendimento mais rápido',
    descricao:
      'Do check-in à receita em PDF em poucos cliques, sem travar o consultório.',
    icone: Zap,
  },
];

export const RECURSOS_LANDING: RecursoLanding[] = [
  {
    id: 'agenda',
    titulo: 'Agenda que não deixa buracos',
    descricao:
      'Organize horários por médico e unidade, bloqueie imprevistos e faça encaixes sem confusão.',
    beneficio: 'Zero choques de horário',
    categoria: 'atendimento',
    icone: CalendarCheck2,
    tag: 'Agenda & Recepção',
  },
  {
    id: 'whatsapp',
    titulo: 'Confirmação sozinha no WhatsApp',
    descricao:
      'O sistema envia lembretes 24h antes e atualiza o status da consulta assim que o paciente responde.',
    beneficio: 'Reduz até 40% das faltas',
    categoria: 'atendimento',
    icone: MessageSquareMore,
    tag: 'Automação',
  },
  {
    id: 'prontuario',
    titulo: 'Prontuário pronto para sua especialidade',
    descricao:
      'Evolua pacientes em segundos com modelos prontos ou personalizados e anexe exames na hora.',
    beneficio: 'Economize 5 min por consulta',
    categoria: 'clinico',
    icone: Stethoscope,
    tag: 'Prontuário Digital',
  },
  {
    id: 'documentos',
    titulo: 'Receitas e atestados em 1 clique',
    descricao:
      'Emita receitas, atestados e pedidos de exames em PDF já com o logotipo da sua clínica.',
    beneficio: 'Zero papel e impressão',
    categoria: 'clinico',
    icone: FileText,
    tag: 'Documentos PDF',
  },
  {
    id: 'multi-unidade',
    titulo: 'Todas as unidades em um só lugar',
    descricao:
      'Histórico único do paciente em toda a rede e relatórios claros para saber onde sua clínica mais rende.',
    beneficio: 'Visão total do negócio',
    categoria: 'gestao',
    icone: Building2,
    tag: 'Multi-Unidades',
  },
  {
    id: 'marca',
    titulo: 'O sistema com a cara da sua clínica',
    descricao:
      'Aplique seu logotipo e escolha temas de cores elegantes para transmitir ainda mais valor.',
    beneficio: 'Sua marca em destaque',
    categoria: 'gestao',
    icone: Palette,
    tag: 'Personalização',
  },
];

export const PILARES_HERO = [
  {
    icone: Clock,
    rotulo: '+3h livres por dia na equipe',
  },
  {
    icone: TrendingUp,
    rotulo: 'Até 40% menos faltas',
  },
  {
    icone: ShieldCheck,
    rotulo: '100% digital e seguro (LGPD)',
  },
] as const;
