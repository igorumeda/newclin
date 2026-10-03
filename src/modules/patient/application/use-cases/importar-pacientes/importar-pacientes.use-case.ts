import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Paciente } from '../../../domain/entities/paciente.entity';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import type {
  ErroImportacaoDto,
  ImportarPacientesInputDto,
  ImportarPacientesOutputDto,
  LinhaImportacaoPaciente,
  RelatorioImportacaoDto,
} from '../../dtos/paciente.dto';

export type ImportarPacientesDependencies = {
  pacienteRepository: IPacienteRepository;
};

export type ImportarPacientesResultado = ImportarPacientesOutputDto;

/**
 * Importação por planilha CSV/Excel (§3.3): valida cada linha pelo domínio,
 * bloqueia duplicados e devolve o relatório com importados/ignorados/erros.
 * A leitura do arquivo e o mapeamento de colunas acontecem no client
 * (PapaParse) — aqui chegam apenas as linhas já normalizadas.
 */
export class ImportarPacientesUseCase extends UseCase<
  ImportarPacientesInputDto,
  ImportarPacientesOutputDto
> {
  private readonly repository: IPacienteRepository;

  constructor(dependencies: ImportarPacientesDependencies) {
    super();
    this.repository = dependencies.pacienteRepository;
  }

  async execute(input: ImportarPacientesInputDto): Promise<Result<ImportarPacientesOutputDto>> {
    if (input.linhas.length === 0) {
      return Result.ok({ relatorio: this.relatorioVazio() });
    }

    const detalhes: ErroImportacaoDto[] = [];
    const idsImportados: string[] = [];

    // CPFs já processados no arquivo: evita duplicidade dentro do próprio lote.
    const cpfsNoLote = new Set<string>();

    for (const linha of input.linhas) {
      const problema = await this.importarLinha({
        redeId: input.redeId,
        linha,
        consentimentoLgpd: input.consentimentoLgpd ?? false,
        cpfsNoLote,
      });

      if (problema) {
        detalhes.push(problema);
        continue;
      }

      const cpfNormalizado = (linha.cpf ?? '').replace(/\D/g, '');
      if (cpfNormalizado) cpfsNoLote.add(cpfNormalizado);
    }

    const ignorados = detalhes.filter((detalhe) => detalhe.motivo.startsWith('Duplicado')).length;

    const relatorio: RelatorioImportacaoDto = {
      totalLinhas: input.linhas.length,
      importados: input.linhas.length - detalhes.length,
      ignorados,
      erros: detalhes.length - ignorados,
      detalhes,
      idsImportados,
    };

    return Result.ok({ relatorio });
  }

  private async importarLinha(params: {
    redeId: string;
    linha: LinhaImportacaoPaciente;
    consentimentoLgpd: boolean;
    cpfsNoLote: Set<string>;
  }): Promise<ErroImportacaoDto | null> {
    const { redeId, linha, consentimentoLgpd, cpfsNoLote } = params;

    const pacienteResult = Paciente.create({
      redeId,
      nome: linha.nome ?? '',
      cpf: linha.cpf ?? '',
      dataNascimento: this.normalizarData(linha.dataNascimento),
      sexo: this.normalizarSexo(linha.sexo),
      contato: { telefone: linha.telefone, email: linha.email },
      endereco: {
        cep: linha.cep,
        logradouro: linha.logradouro,
        numero: linha.numero,
        complemento: linha.complemento,
        bairro: linha.bairro,
        cidade: linha.cidade,
        uf: linha.uf,
      },
      responsavel: {
        nome: linha.responsavelNome,
        telefone: linha.responsavelTelefone,
        parentesco: linha.responsavelParentesco,
      },
      alergias: linha.alergias,
      condicoesCronicas: linha.condicoesCronicas,
      observacoes: linha.observacoes,
      consentimentoLgpd,
      consentimentoOrigem: 'importacao',
      importado: true,
    });

    if (pacienteResult.isFailure) {
      return {
        linha: linha.linha,
        nome: linha.nome ?? null,
        cpf: linha.cpf ?? null,
        motivo: pacienteResult.error.message,
      };
    }

    const paciente = pacienteResult.value;

    if (cpfsNoLote.has(paciente.cpf.valor)) {
      return {
        linha: linha.linha,
        nome: paciente.nome.valor,
        cpf: paciente.cpf.formatado(),
        motivo: 'Duplicado: CPF repetido no próprio arquivo importado',
      };
    }

    const duplicados = await this.repository.verificarDuplicidade({
      redeId,
      cpf: paciente.cpf.valor,
      nome: paciente.nome.valor,
      dataNascimento: paciente.dataNascimento.paraISO(),
    });

    if (duplicados.length > 0) {
      const duplicado = duplicados[0];
      return {
        linha: linha.linha,
        nome: paciente.nome.valor,
        cpf: paciente.cpf.formatado(),
        motivo: `Duplicado: já existe ${duplicado.nome} (${
          duplicado.motivo === 'cpf' ? 'mesmo CPF' : 'mesmo nome e data de nascimento'
        })`,
      };
    }

    await this.repository.save(paciente);

    return null;
  }

  /** Aceita DD/MM/AAAA, AAAA-MM-DD e DD-MM-AAAA. */
  private normalizarData(valor?: string): string {
    const texto = (valor ?? '').trim();
    if (!texto) return '';

    const brasileiro = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (brasileiro) return `${brasileiro[3]}-${brasileiro[2]}-${brasileiro[1]}`;

    return texto.slice(0, 10);
  }

  private normalizarSexo(valor?: string): string {
    const texto = (valor ?? '').trim().toLowerCase();
    if (!texto) return 'nao_informado';
    if (texto.startsWith('f')) return 'feminino';
    if (texto.startsWith('m') && !texto.startsWith('ma')) return 'masculino';
    if (texto.startsWith('ma')) return 'masculino';
    if (texto.startsWith('o')) return 'outro';
    return 'nao_informado';
  }

  private relatorioVazio(): RelatorioImportacaoDto {
    return {
      totalLinhas: 0,
      importados: 0,
      ignorados: 0,
      erros: 0,
      detalhes: [],
      idsImportados: [],
    };
  }
}
