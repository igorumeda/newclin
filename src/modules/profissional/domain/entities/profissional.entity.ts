import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Especialidade } from '../value-objects/especialidade.vo';
import { RegistroConselho } from '../value-objects/registro-conselho.vo';

export type ProfissionalProps = {
  redeId: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  registro: RegistroConselho;
  especialidade: Especialidade;
  corAgenda: string;
  unidades: string[];
  ativo: boolean;
};

export type ProfissionalConstructorParams = EntityConstructorParams<ProfissionalProps>;
export type ReconstituirProfissionalParams = ProfissionalConstructorParams & {
  id: NonNullable<ProfissionalConstructorParams['id']>;
};
export type CriarProfissionalParams = {
  redeId: string;
  nome: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  conselho: string;
  numeroConselho: string;
  ufConselho?: string | null;
  especialidade: string;
  corAgenda?: string;
  unidades?: string[];
};
export type AtualizarProfissionalParams = {
  nome?: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  conselho?: string;
  numeroConselho?: string;
  ufConselho?: string | null;
  especialidade?: string;
  corAgenda?: string;
  unidades?: string[];
};
export type AtuaNaUnidadeParams = { unidadeId: string };

const COR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export class Profissional extends AggregateRoot<ProfissionalProps> {
  private constructor(params: ProfissionalConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get cpf(): string | null {
    return this.props.cpf;
  }

  get email(): string | null {
    return this.props.email;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get registro(): RegistroConselho {
    return this.props.registro;
  }

  get especialidade(): Especialidade {
    return this.props.especialidade;
  }

  get corAgenda(): string {
    return this.props.corAgenda;
  }

  get unidades(): string[] {
    return [...this.props.unidades];
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CriarProfissionalParams): Result<Profissional> {
    if (!params.nome || params.nome.trim().length < 3) {
      return Result.fail(new Error('Nome do profissional deve ter no mínimo 3 caracteres'));
    }
    const registroResult = RegistroConselho.create({
      conselho: params.conselho,
      numero: params.numeroConselho,
      uf: params.ufConselho ?? null,
    });
    if (registroResult.isFailure) return Result.propagate(registroResult);

    const especialidadeResult = Especialidade.create(params.especialidade);
    if (especialidadeResult.isFailure) return Result.propagate(especialidadeResult);

    const cor = params.corAgenda ?? '#0ea5e9';
    if (!COR_PATTERN.test(cor)) {
      return Result.fail(new Error('Cor da agenda deve estar no formato hexadecimal (#RRGGBB)'));
    }

    return Result.ok(
      new Profissional({
        props: {
          redeId: params.redeId,
          nome: params.nome.trim(),
          cpf: params.cpf?.replace(/\D+/g, '') || null,
          email: params.email?.trim().toLowerCase() || null,
          telefone: params.telefone?.trim() || null,
          registro: registroResult.value,
          especialidade: especialidadeResult.value,
          corAgenda: cor,
          unidades: params.unidades ?? [],
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirProfissionalParams): Profissional {
    return new Profissional(params);
  }

  public atuaNaUnidade({ unidadeId }: AtuaNaUnidadeParams): boolean {
    return this.props.unidades.includes(unidadeId);
  }

  public atualizar(params: AtualizarProfissionalParams): Result<void> {
    if (params.nome !== undefined) {
      if (params.nome.trim().length < 3) {
        return Result.fail(new Error('Nome do profissional deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = params.nome.trim();
    }
    if (params.conselho !== undefined || params.numeroConselho !== undefined) {
      const registroResult = RegistroConselho.create({
        conselho: params.conselho ?? this.props.registro.conselho,
        numero: params.numeroConselho ?? this.props.registro.numero,
        uf: params.ufConselho ?? this.props.registro.uf,
      });
      if (registroResult.isFailure) return Result.propagate(registroResult);
      this.props.registro = registroResult.value;
    }
    if (params.especialidade !== undefined) {
      const especialidadeResult = Especialidade.create(params.especialidade);
      if (especialidadeResult.isFailure) return Result.propagate(especialidadeResult);
      this.props.especialidade = especialidadeResult.value;
    }
    if (params.corAgenda !== undefined) {
      if (!COR_PATTERN.test(params.corAgenda)) {
        return Result.fail(new Error('Cor da agenda deve estar no formato hexadecimal (#RRGGBB)'));
      }
      this.props.corAgenda = params.corAgenda;
    }
    if (params.cpf !== undefined) this.props.cpf = params.cpf?.replace(/\D+/g, '') || null;
    if (params.email !== undefined) this.props.email = params.email?.trim().toLowerCase() || null;
    if (params.telefone !== undefined) this.props.telefone = params.telefone?.trim() || null;
    if (params.unidades !== undefined) this.props.unidades = [...params.unidades];
    this.touch();
    return Result.ok();
  }

  public desativar(): Result<void> {
    if (!this.props.ativo) return Result.fail(new Error('Profissional já está inativo'));
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) return Result.fail(new Error('Profissional já está ativo'));
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
