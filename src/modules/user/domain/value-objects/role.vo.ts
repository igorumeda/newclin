import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type AppRole = 'admin_rede' | 'gestor_unidade' | 'profissional' | 'recepcao';
export type RoleValue = AppRole;
export type RoleProps = { value: RoleValue };

export const ROLE_VALUES: AppRole[] = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin_rede: 'Admin da Rede',
  gestor_unidade: 'Gestor de Unidade',
  profissional: 'Médico/Profissional',
  recepcao: 'Recepção',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin_rede: 'Acesso total à rede, configurações, usuários e relatórios.',
  gestor_unidade: 'Gerencia agenda, pacientes e relatórios das unidades atribuídas.',
  profissional: 'Acessa a própria agenda, prontuários dos pacientes que atende e emite documentos.',
  recepcao: 'Opera agenda e cadastro das unidades atribuídas, sem acesso ao conteúdo clínico.',
};

/** Permissões granulares reutilizadas pelo client (UI) e pelo server (API). */
export const PERMISSIONS = [
  'organizacao:ler',
  'organizacao:editar',
  'tema:editar',
  'unidades:gerenciar',
  'profissionais:gerenciar',
  'usuarios:ler',
  'usuarios:gerenciar',
  'pacientes:ler',
  'pacientes:criar',
  'pacientes:editar',
  'pacientes:inativar',
  'pacientes:importar',
  'pacientes:exportar',
  'agenda:ler',
  'agenda:criar',
  'agenda:editar',
  'agenda:cancelar',
  'agenda:encaixar',
  'recepcao:operar',
  'prontuario:ler',
  'prontuario:escrever',
  'prontuario:adendo',
  'templates:gerenciar',
  'documentos:ler',
  'documentos:emitir',
  'documentos:cancelar',
  'relatorios:ler',
  'auditoria:ler',
  'notificacoes:ler',
  'notificacoes:enviar',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin_rede: [...PERMISSIONS],
  gestor_unidade: [
    'organizacao:ler',
    'pacientes:ler',
    'pacientes:criar',
    'pacientes:editar',
    'pacientes:inativar',
    'pacientes:importar',
    'pacientes:exportar',
    'agenda:ler',
    'agenda:criar',
    'agenda:editar',
    'agenda:cancelar',
    'agenda:encaixar',
    'recepcao:operar',
    'prontuario:ler',
    'documentos:ler',
    'documentos:cancelar',
    'relatorios:ler',
    'notificacoes:ler',
    'notificacoes:enviar',
  ],
  profissional: [
    'organizacao:ler',
    'pacientes:ler',
    'pacientes:criar',
    'pacientes:editar',
    'pacientes:exportar',
    'agenda:ler',
    'agenda:criar',
    'agenda:editar',
    'prontuario:ler',
    'prontuario:escrever',
    'prontuario:adendo',
    'documentos:ler',
    'documentos:emitir',
    'relatorios:ler',
  ],
  recepcao: [
    'organizacao:ler',
    'pacientes:ler',
    'pacientes:criar',
    'pacientes:editar',
    'pacientes:importar',
    'agenda:ler',
    'agenda:criar',
    'agenda:editar',
    'agenda:cancelar',
    'agenda:encaixar',
    'recepcao:operar',
    'documentos:ler',
    'notificacoes:ler',
    'notificacoes:enviar',
  ],
};

export class Role extends ValueObject<RoleProps> {
  private constructor(props: RoleProps) {
    super(props);
  }

  get value(): RoleValue {
    return this.props.value;
  }

  get label(): string {
    return ROLE_LABELS[this.props.value];
  }

  get permissions(): Permission[] {
    return ROLE_PERMISSIONS[this.props.value];
  }

  public isAdmin(): boolean {
    return this.props.value === 'admin_rede';
  }

  public isProfessional(): boolean {
    return this.props.value === 'profissional';
  }

  public can(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  /** A recepção nunca acessa o conteúdo clínico do prontuário (§3.2). */
  public hasClinicalAccess(): boolean {
    return this.props.value !== 'recepcao';
  }

  public static create(value: string): Result<Role> {
    if (!ROLE_VALUES.includes(value as AppRole)) {
      return Result.fail(new Error(`Papel inválido: "${value}"`));
    }
    return Result.ok(new Role({ value: value as AppRole }));
  }

  public static reconstitute(value: RoleValue): Role {
    return new Role({ value });
  }
}
