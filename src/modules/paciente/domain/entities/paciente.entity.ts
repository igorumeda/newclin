import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Cpf } from '../value-objects/cpf.vo';
import { DataNascimento } from '../value-objects/data-nascimento.vo';
import { Sexo } from '../value-objects/sexo.vo';
import { Telefone } from '../value-objects/telefone.vo';
import { PacienteCriadoEvent } from '../events/paciente-criado.event';

export type EnderecoPaciente = {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
};

export const ENDERECO_PACIENTE_VAZIO: EnderecoPaciente = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
};

export type PacienteProps = {
  redeId: string;
  nome: string;
  cpf: Cpf;
  dataNascimento: DataNascimento;
  sexo: Sexo;
  telefone: Telefone | null;
  email: string | null;
  endereco: EnderecoPaciente;
  responsavelNome: string | null;
  responsavelTelefone: Telefone | null;
  alergias: string[];
  condicoesCronicas: string[];
  observacoes: string | null;
  consentimentoLgpd: boolean;
  consentimentoEm: Date | null;
  ativo: boolean;
};

export type PacienteConstructorParams = EntityConstructorParams<PacienteProps>;
export type ReconstituirPacienteParams = PacienteConstructorParams & {
  id: NonNullable<PacienteConstructorParams['id']>;
};

export type CriarPacienteParams = {
  redeId: string;
  nome: string;
  cpf: string;
  dataNascimento: string | Date;
  sexo: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: Partial<EnderecoPaciente>;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  alergias?: string[];
  condicoesCronicas?: string[];
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
};

export type AtualizarPacienteParams = Omit<Partial<CriarPacienteParams>, 'redeId'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Paciente extends AggregateRoot<PacienteProps> {
  private constructor(params: PacienteConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get cpf(): Cpf {
    return this.props.cpf;
  }

  get dataNascimento(): DataNascimento {
    return this.props.dataNascimento;
  }

  get sexo(): Sexo {
    return this.props.sexo;
  }

  get telefone(): Telefone | null {
    return this.props.telefone;
  }

  get email(): string | null {
    return this.props.email;
  }

  get endereco(): EnderecoPaciente {
    return { ...this.props.endereco };
  }

  get responsavelNome(): string | null {
    return this.props.responsavelNome;
  }

  get responsavelTelefone(): Telefone | null {
    return this.props.responsavelTelefone;
  }

  get alergias(): string[] {
    return [...this.props.alergias];
  }

  get condicoesCronicas(): string[] {
    return [...this.props.condicoesCronicas];
  }

  get observacoes(): string | null {
    return this.props.observacoes;
  }

  get consentimentoLgpd(): boolean {
    return this.props.consentimentoLgpd;
  }

  get consentimentoEm(): Date | null {
    return this.props.consentimentoEm;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get idade(): number {
    return this.props.dataNascimento.idadeEm();
  }

  get isMenorDeIdade(): boolean {
    return this.props.dataNascimento.isMenorDeIdade();
  }

  public static create(params: CriarPacienteParams): Result<Paciente> {
    const nome = (params.nome ?? '').trim().replace(/\s+/g, ' ');
    if (nome.length < 3) {
      return Result.fail(new Error('Nome completo deve ter no mínimo 3 caracteres'));
    }

    const cpfResult = Cpf.create(params.cpf);
    if (cpfResult.isFailure) return Result.propagate(cpfResult);

    const nascimentoResult = DataNascimento.create(params.dataNascimento);
    if (nascimentoResult.isFailure) return Result.propagate(nascimentoResult);

    const sexoResult = Sexo.create(params.sexo);
    if (sexoResult.isFailure) return Result.propagate(sexoResult);

    const telefoneResult = Paciente.criarTelefoneOpcional(params.telefone);
    if (telefoneResult.isFailure) return Result.propagate(telefoneResult);

    const responsavelTelefoneResult = Paciente.criarTelefoneOpcional(params.responsavelTelefone);
    if (responsavelTelefoneResult.isFailure) return Result.propagate(responsavelTelefoneResult);

    const email = params.email?.trim().toLowerCase() || null;
    if (email && !EMAIL_PATTERN.test(email)) {
      return Result.fail(new Error('Formato de e-mail inválido'));
    }

    const responsavelNome = params.responsavelNome?.trim() || null;
    if (nascimentoResult.value.isMenorDeIdade() && !responsavelNome) {
      return Result.fail(
        new Error('Nome do responsável é obrigatório para pacientes menores de 18 anos'),
      );
    }

    const paciente = new Paciente({
      props: {
        redeId: params.redeId,
        nome,
        cpf: cpfResult.value,
        dataNascimento: nascimentoResult.value,
        sexo: sexoResult.value,
        telefone: telefoneResult.value,
        email,
        endereco: { ...ENDERECO_PACIENTE_VAZIO, ...(params.endereco ?? {}) },
        responsavelNome,
        responsavelTelefone: responsavelTelefoneResult.value,
        alergias: Paciente.normalizarLista(params.alergias),
        condicoesCronicas: Paciente.normalizarLista(params.condicoesCronicas),
        observacoes: params.observacoes?.trim() || null,
        consentimentoLgpd: params.consentimentoLgpd ?? false,
        consentimentoEm: params.consentimentoLgpd ? new Date() : null,
        ativo: true,
      },
    });

    paciente.addDomainEvent(
      new PacienteCriadoEvent({
        redeId: params.redeId,
        pacienteId: paciente.id.toString(),
        nome: paciente.nome,
      }),
    );

    return Result.ok(paciente);
  }

  public static reconstitute(params: ReconstituirPacienteParams): Paciente {
    return new Paciente(params);
  }

  private static normalizarLista(valores?: string[]): string[] {
    if (!valores) return [];
    return valores.map((valor) => valor.trim()).filter((valor) => valor.length > 0);
  }

  private static criarTelefoneOpcional(valor?: string | null): Result<Telefone | null> {
    if (!valor || !valor.trim()) return Result.ok(null);
    const telefoneResult = Telefone.create(valor);
    if (telefoneResult.isFailure) return Result.propagate(telefoneResult);
    return Result.ok(telefoneResult.value);
  }

  public atualizar(params: AtualizarPacienteParams): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim().replace(/\s+/g, ' ');
      if (nome.length < 3) {
        return Result.fail(new Error('Nome completo deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = nome;
    }
    if (params.cpf !== undefined) {
      const cpfResult = Cpf.create(params.cpf);
      if (cpfResult.isFailure) return Result.propagate(cpfResult);
      this.props.cpf = cpfResult.value;
    }
    if (params.dataNascimento !== undefined) {
      const nascimentoResult = DataNascimento.create(params.dataNascimento);
      if (nascimentoResult.isFailure) return Result.propagate(nascimentoResult);
      this.props.dataNascimento = nascimentoResult.value;
    }
    if (params.sexo !== undefined) {
      const sexoResult = Sexo.create(params.sexo);
      if (sexoResult.isFailure) return Result.propagate(sexoResult);
      this.props.sexo = sexoResult.value;
    }
    if (params.telefone !== undefined) {
      const telefoneResult = Paciente.criarTelefoneOpcional(params.telefone);
      if (telefoneResult.isFailure) return Result.propagate(telefoneResult);
      this.props.telefone = telefoneResult.value;
    }
    if (params.responsavelTelefone !== undefined) {
      const responsavelResult = Paciente.criarTelefoneOpcional(params.responsavelTelefone);
      if (responsavelResult.isFailure) return Result.propagate(responsavelResult);
      this.props.responsavelTelefone = responsavelResult.value;
    }
    if (params.email !== undefined) {
      const email = params.email?.trim().toLowerCase() || null;
      if (email && !EMAIL_PATTERN.test(email)) {
        return Result.fail(new Error('Formato de e-mail inválido'));
      }
      this.props.email = email;
    }
    if (params.endereco !== undefined) {
      this.props.endereco = { ...this.props.endereco, ...params.endereco };
    }
    if (params.responsavelNome !== undefined) {
      this.props.responsavelNome = params.responsavelNome?.trim() || null;
    }
    if (params.alergias !== undefined) {
      this.props.alergias = Paciente.normalizarLista(params.alergias);
    }
    if (params.condicoesCronicas !== undefined) {
      this.props.condicoesCronicas = Paciente.normalizarLista(params.condicoesCronicas);
    }
    if (params.observacoes !== undefined) {
      this.props.observacoes = params.observacoes?.trim() || null;
    }
    if (params.consentimentoLgpd !== undefined) {
      this.registrarConsentimento(params.consentimentoLgpd);
    }
    if (this.props.dataNascimento.isMenorDeIdade() && !this.props.responsavelNome) {
      return Result.fail(
        new Error('Nome do responsável é obrigatório para pacientes menores de 18 anos'),
      );
    }
    this.touch();
    return Result.ok();
  }

  private registrarConsentimento(consentiu: boolean): void {
    if (consentiu && !this.props.consentimentoLgpd) {
      this.props.consentimentoEm = new Date();
    }
    if (!consentiu) {
      this.props.consentimentoEm = null;
    }
    this.props.consentimentoLgpd = consentiu;
  }

  public inativar(): Result<void> {
    if (!this.props.ativo) return Result.fail(new Error('Paciente já está inativo'));
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) return Result.fail(new Error('Paciente já está ativo'));
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
