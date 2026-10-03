import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Users,
  UserSquare2,
} from 'lucide-react';
import type { Permission } from '@/modules/user/domain/value-objects/role.vo';

export type ItemNavegacao = {
  titulo: string;
  href: string;
  icone: React.ElementType;
  /** Permissão exigida (§2.3). O item some quando o papel não a possui. */
  permissao?: Permission;
  /** Agrupamento visual da barra lateral. */
  grupo: 'operacao' | 'clinico' | 'gestao';
};

export const NAVEGACAO: ItemNavegacao[] = [
  { titulo: 'Dashboard', href: '/dashboard', icone: LayoutDashboard, permissao: 'relatorios:ler', grupo: 'gestao' },
  { titulo: 'Agenda', href: '/agenda', icone: CalendarDays, permissao: 'agenda:ler', grupo: 'operacao' },
  { titulo: 'Recepção', href: '/recepcao', icone: ClipboardList, permissao: 'recepcao:operar', grupo: 'operacao' },
  { titulo: 'Pacientes', href: '/pacientes', icone: Users, permissao: 'pacientes:ler', grupo: 'operacao' },
  { titulo: 'Atendimentos', href: '/atendimentos', icone: Stethoscope, permissao: 'prontuario:ler', grupo: 'clinico' },
  { titulo: 'Documentos', href: '/documentos', icone: FileText, permissao: 'documentos:ler', grupo: 'clinico' },
  { titulo: 'Relatórios', href: '/relatorios', icone: BarChart3, permissao: 'relatorios:ler', grupo: 'gestao' },
  { titulo: 'Unidades', href: '/unidades', icone: Building2, permissao: 'unidades:gerenciar', grupo: 'gestao' },
  { titulo: 'Profissionais', href: '/profissionais', icone: UserSquare2, permissao: 'profissionais:gerenciar', grupo: 'gestao' },
  { titulo: 'Usuários', href: '/usuarios', icone: ShieldCheck, permissao: 'usuarios:gerenciar', grupo: 'gestao' },
  { titulo: 'Configurações', href: '/configuracoes', icone: ScrollText, permissao: 'tema:editar', grupo: 'gestao' },
];

export const ROTULOS_GRUPO: Record<ItemNavegacao['grupo'], string> = {
  operacao: 'Operação',
  clinico: 'Clínico',
  gestao: 'Gestão',
};
