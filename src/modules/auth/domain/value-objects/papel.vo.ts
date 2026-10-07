import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export const PAPEIS = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'] as const;
export type PapelValue = (typeof PAPEIS)[number];
export type PapelProps = { value: PapelValue };
export type PodeParams = { permissao: Permissao };

export const PERMISSOES = [
  'rede:configurar',
  'unidade:ler',
  'unidade:escrever',
  'usuario:ler',
  'usuario:escrever',
  'profissional:ler',
  'profissional:escrever',
  'paciente:ler',
  'paciente:escrever',
  'paciente:excluir',
  'paciente:importar',
  'agenda:ler',
  'agenda:escrever',
  'prontuario:ler',
  'prontuario:escrever',
  'template:ler',
  'template:escrever',
  'documento:emitir',
  'relatorio:ler',
  'auditoria:ler',
  'notificacao:ler',
] as const;
export type Permissao = (typeof PERMISSOES)[number];

export const ROTULO_PAPEL: Record<PapelValue, string> = {
  admin_rede: 'Admin da Rede',
  gestor_unidade: 'Gestor de Unidade',
  profissional: 'Médico/Profissional',
  recepcao: 'Recepção',
};

/**
 * Matriz de permissões por papel (agents/spec-v1.md §3.2).
 * É isomórfica: a sidebar do client e os middlewares do server usam a mesma fonte.
 */
export const PERMISSOES_POR_PAPEL: Record<PapelValue, readonly Permissao[]> = {
  admin_rede: PERMISSOES,
  gestor_unidade: [
    'unidade:ler',
    'usuario:ler',
    'profissional:ler',
    'profissional:escrever',
    'paciente:ler',
    'paciente:escrever',
    'paciente:importar',
    'agenda:ler',
    'agenda:escrever',
    'template:ler',
    'relatorio:ler',
    'notificacao:ler',
  ],
  profissional: [
    'unidade:ler',
    'paciente:ler',
    'paciente:escrever',
    'agenda:ler',
    'agenda:escrever',
    'prontuario:ler',
    'prontuario:escrever',
    'template:ler',
    'documento:emitir',
  ],
  recepcao: [
    'unidade:ler',
    'paciente:ler',
    'paciente:escrever',
    'paciente:importar',
    'agenda:ler',
    'agenda:escrever',
  ],
};

export class Papel extends ValueObject<PapelProps> {
  private constructor(props: PapelProps) {
    super(props);
  }

  get value(): PapelValue {
    return this.props.value;
  }

  get rotulo(): string {
    return ROTULO_PAPEL[this.props.value];
  }

  get permissoes(): readonly Permissao[] {
    return PERMISSOES_POR_PAPEL[this.props.value];
  }

  public pode({ permissao }: PodeParams): boolean {
    return this.permissoes.includes(permissao);
  }

  public static create(papel: string): Result<Papel> {
    if (!PAPEIS.includes(papel as PapelValue)) {
      return Result.fail(new Error(`Papel inválido: ${papel}`));
    }
    return Result.ok(new Papel({ value: papel as PapelValue }));
  }

  public static reconstitute(value: PapelValue): Papel {
    return new Papel({ value });
  }
}

export type PodePermissaoParams = { role: string; permissao: Permissao };

/** Helper isomórfico usado por UI e middlewares sem instanciar o VO. */
export function podePermissao({ role, permissao }: PodePermissaoParams): boolean {
  const permissoes = PERMISSOES_POR_PAPEL[role as PapelValue];
  return permissoes ? permissoes.includes(permissao) : false;
}
