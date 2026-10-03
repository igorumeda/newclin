import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Cpf } from '../value-objects/cpf.vo';
import { NomeCompleto } from '../value-objects/nome-completo.vo';
import { DataNascimento } from '../value-objects/data-nascimento.vo';
import { Sexo } from '../value-objects/sexo.vo';
import { Contato } from '../value-objects/contato.vo';
import type { ContatoValue } from '../value-objects/contato.vo';
import { Endereco } from '../value-objects/endereco.vo';
import type { EnderecoValue } from '../value-objects/endereco.vo';
import { Responsavel } from '../value-objects/responsavel.vo';
import type { ResponsavelValue } from '../value-objects/responsavel.vo';
import { ResponsavelObrigatorioError } from '../errors/paciente.errors';

export type ConsentimentoLgpd = {
  concedido: boolean;
  em: Date | null;
  origem: string | null;
};

export type PacienteProps = {
  redeId: string;
  nome: NomeCompleto;
  cpf: Cpf;
  dataNascimento: DataNascimento;
  sexo: Sexo;
  contato: Contato;
  endereco: Endereco;
  responsavel: Responsavel;
  alergias: string | null;
  condicoesCronicas: string | null;
  observacoes: string | null;
  consentimentoLgpd: ConsentimentoLgpd;
  importadoEm: Date | null;
  ativo: boolean;
};

export type PacienteConstructorParams = EntityConstructorParams<PacienteProps>;

export type CreatePacienteParams = {
  redeId: string;
  nome: string;
  cpf: string;
  dataNascimento: string | Date;
  sexo: string;
  contato?: ContatoValue;
  endereco?: EnderecoValue;
  responsavel?: ResponsavelValue;
  alergias?: string | null;
  condicoesCronicas?: string | null;
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
  consentimentoOrigem?: string | null;
  /** Registra a data de importação (planilha CSV/Excel, §3.3). */
  importado?: boolean;
};

export type AtualizarPacienteParams = {
  nome?: string;
  cpf?: string;
  dataNascimento?: string | Date;
  sexo?: string;
  /** Telefone/e-mail do paciente + dados de contato do responsável. */
  contato?: ContatoValue;
  endereco?: EnderecoValue;
  responsavel?: ResponsavelValue;
  alergias?: string | null;
  condicoesCronicas?: string | null;
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
  consentimentoOrigem?: string | null;
};

/**
 * Paciente (§3.3) — pertence à REDE e é atendido em qualquer unidade.
 * O prontuário é único e compartilhado; a exclusão é sempre lógica (soft delete).
 */
export class Paciente extends AggregateRoot<PacienteProps> {
  private constructor(params: PacienteConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get nome(): NomeCompleto {
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
  get contato(): Contato {
    return this.props.contato;
  }
  get endereco(): Endereco {
    return this.props.endereco;
  }
  get responsavel(): Responsavel {
    return this.props.responsavel;
  }
  get alergias(): string | null {
    return this.props.alergias;
  }
  get condicoesCronicas(): string | null {
    return this.props.condicoesCronicas;
  }
  get observacoes(): string | null {
    return this.props.observacoes;
  }
  get consentimentoLgpd(): ConsentimentoLgpd {
    return this.props.consentimentoLgpd;
  }
  get importadoEm(): Date | null {
    return this.props.importadoEm;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public idade(referencia?: Date): number {
    return this.props.dataNascimento.idade(referencia);
  }

  public isMenorDeIdade(referencia?: Date): boolean {
    return this.props.dataNascimento.isMenorDeIdade(referencia);
  }

  /** Telefone pronto para WhatsApp; e-mail para o fallback (§4.2). */
  public telefoneE164(paisPadrao = '55'): string | null {
    return this.props.contato.telefoneE164(paisPadrao);
  }

  public static create(params: CreatePacienteParams): Result<Paciente> {
    const nomeResult = NomeCompleto.create(params.nome);
    if (nomeResult.isFailure) return Result.fail(nomeResult.error);

    const cpfResult = Cpf.create(params.cpf);
    if (cpfResult.isFailure) return Result.fail(cpfResult.error);

    const nascimentoResult = DataNascimento.create(params.dataNascimento);
    if (nascimentoResult.isFailure) return Result.fail(nascimentoResult.error);

    const sexoResult = Sexo.create(params.sexo);
    if (sexoResult.isFailure) return Result.fail(sexoResult.error);

    const contatoResult = Contato.create(params.contato ?? {});
    if (contatoResult.isFailure) return Result.fail(contatoResult.error);

    const enderecoResult = Endereco.create(params.endereco ?? {});
    if (enderecoResult.isFailure) return Result.fail(enderecoResult.error);

    const responsavelResult = Responsavel.create({
      nome: params.responsavel?.nome ?? params.contato?.responsavelNome ?? null,
      cpf: params.responsavel?.cpf ?? params.contato?.responsavelCpf ?? null,
      telefone: params.responsavel?.telefone ?? params.contato?.responsavelTelefone ?? null,
      parentesco: params.responsavel?.parentesco ?? params.contato?.responsavelParentesco ?? null,
    });
    if (responsavelResult.isFailure) return Result.fail(responsavelResult.error);

    const paciente = new Paciente({
      props: {
        redeId: params.redeId,
        nome: nomeResult.value,
        cpf: cpfResult.value,
        dataNascimento: nascimentoResult.value,
        sexo: sexoResult.value,
        contato: contatoResult.value,
        endereco: enderecoResult.value,
        responsavel: responsavelResult.value,
        alergias: params.alergias ?? null,
        condicoesCronicas: params.condicoesCronicas ?? null,
        observacoes: params.observacoes ?? null,
        consentimentoLgpd: {
          concedido: params.consentimentoLgpd ?? false,
          em: params.consentimentoLgpd ? new Date() : null,
          origem: params.consentimentoLgpd ? (params.consentimentoOrigem ?? 'recepcao') : null,
        },
        importadoEm: params.importado ? new Date() : null,
        ativo: true,
      },
    });

    const responsavelObrigatorio = paciente.validarResponsavel();
    if (responsavelObrigatorio.isFailure) return Result.fail(responsavelObrigatorio.error);

    return Result.ok(paciente);
  }

  public static reconstitute(params: PacienteConstructorParams): Paciente {
    return new Paciente(params);
  }

  public atualizar(params: AtualizarPacienteParams): Result<void> {
    if (params.nome !== undefined) {
      const nomeResult = NomeCompleto.create(params.nome);
      if (nomeResult.isFailure) return Result.fail(nomeResult.error);
      this.props.nome = nomeResult.value;
    }

    if (params.cpf !== undefined) {
      const cpfResult = Cpf.create(params.cpf);
      if (cpfResult.isFailure) return Result.fail(cpfResult.error);
      this.props.cpf = cpfResult.value;
    }

    if (params.dataNascimento !== undefined) {
      const nascimentoResult = DataNascimento.create(params.dataNascimento);
      if (nascimentoResult.isFailure) return Result.fail(nascimentoResult.error);
      this.props.dataNascimento = nascimentoResult.value;
    }

    if (params.sexo !== undefined) {
      const sexoResult = Sexo.create(params.sexo);
      if (sexoResult.isFailure) return Result.fail(sexoResult.error);
      this.props.sexo = sexoResult.value;
    }

    if (params.contato !== undefined) {
      const contatoResult = Contato.create({
        telefone: params.contato.telefone ?? this.props.contato.telefone,
        email: params.contato.email ?? this.props.contato.email,
        responsavelNome: params.contato.responsavelNome ?? this.props.contato.responsavelNome,
        responsavelTelefone: params.contato.responsavelTelefone ?? this.props.contato.responsavelTelefone,
        responsavelParentesco:
          params.contato.responsavelParentesco ?? this.props.contato.responsavelParentesco,
      });
      if (contatoResult.isFailure) return Result.fail(contatoResult.error);
      this.props.contato = contatoResult.value;
    }

    if (params.endereco !== undefined) {
      const enderecoResult = Endereco.create(params.endereco);
      if (enderecoResult.isFailure) return Result.fail(enderecoResult.error);
      this.props.endereco = enderecoResult.value;
    }

    if (params.responsavel !== undefined || params.contato?.responsavelNome !== undefined) {
      const responsavelResult = Responsavel.create(
        params.responsavel ?? {
          nome: params.contato?.responsavelNome ?? this.props.responsavel.nome,
          telefone: params.contato?.responsavelTelefone ?? this.props.responsavel.telefone,
          parentesco: params.contato?.responsavelParentesco ?? this.props.responsavel.parentesco,
        },
      );
      if (responsavelResult.isFailure) return Result.fail(responsavelResult.error);
      this.props.responsavel = responsavelResult.value;
    }

    if (params.consentimentoLgpd !== undefined) {
      this.registrarConsentimento({
        concedido: params.consentimentoLgpd,
        origem: params.consentimentoOrigem ?? 'atualizacao',
      });
    }

    if (params.alergias !== undefined) this.props.alergias = params.alergias;
    if (params.condicoesCronicas !== undefined) this.props.condicoesCronicas = params.condicoesCronicas;
    if (params.observacoes !== undefined) this.props.observacoes = params.observacoes;

    const responsavelObrigatorio = this.validarResponsavel();
    if (responsavelObrigatorio.isFailure) return Result.fail(responsavelObrigatorio.error);

    this.touch();
    return Result.ok();
  }

  public registrarConsentimento(params: { concedido: boolean; origem: string }): Result<void> {
    this.props.consentimentoLgpd = {
      concedido: params.concedido,
      em: params.concedido ? new Date() : null,
      origem: params.origem,
    };
    this.touch();
    return Result.ok();
  }

  /** Soft delete: pacientes nunca são removidos fisicamente (§5). */
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

  private validarResponsavel(): Result<void> {
    if (!this.props.dataNascimento.isMenorDeIdade()) return Result.ok();

    if (!this.props.responsavel.informado()) {
      return Result.fail(
        new ResponsavelObrigatorioError({
          reason: 'Nome do responsável é obrigatório para pacientes menores de 18 anos',
        }),
      );
    }

    return Result.ok();
  }
}
