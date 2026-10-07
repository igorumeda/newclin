import type { Permissao } from '@/modules/auth/domain/value-objects/papel.vo';

export type ItemNavegacao = {
  titulo: string;
  href: string;
  icone: string;
  permissao?: Permissao;
};

export type GrupoNavegacao = { titulo: string; itens: ItemNavegacao[] };

export const NAVEGACAO_PRINCIPAL: GrupoNavegacao[] = [
  {
    titulo: 'Atendimento',
    itens: [
      { titulo: 'Dashboard', href: '/dashboard', icone: 'LayoutDashboard' },
      { titulo: 'Agenda', href: '/agenda', icone: 'CalendarDays', permissao: 'agenda:ler' },
      { titulo: 'Recepção', href: '/recepcao', icone: 'ConciergeBell', permissao: 'agenda:ler' },
      { titulo: 'Pacientes', href: '/pacientes', icone: 'Users', permissao: 'paciente:ler' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      {
        titulo: 'Profissionais',
        href: '/profissionais',
        icone: 'Stethoscope',
        permissao: 'profissional:ler',
      },
      { titulo: 'Unidades', href: '/unidades', icone: 'Building2', permissao: 'unidade:ler' },
      { titulo: 'Usuários', href: '/usuarios', icone: 'UserCog', permissao: 'usuario:ler' },
      {
        titulo: 'Templates',
        href: '/templates',
        icone: 'FileSpreadsheet',
        permissao: 'template:ler',
      },
    ],
  },
  {
    titulo: 'Análise',
    itens: [
      {
        titulo: 'Relatórios',
        href: '/relatorios',
        icone: 'BarChart3',
        permissao: 'relatorio:ler',
      },
      { titulo: 'Auditoria', href: '/auditoria', icone: 'ShieldCheck', permissao: 'auditoria:ler' },
      {
        titulo: 'Configurações',
        href: '/configuracoes',
        icone: 'Settings',
        permissao: 'rede:configurar',
      },
    ],
  },
];
