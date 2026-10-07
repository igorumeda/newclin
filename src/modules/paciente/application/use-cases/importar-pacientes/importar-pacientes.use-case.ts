import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Paciente } from '../../../domain/entities/paciente.entity';
import { DetectorDuplicidadeService } from '../../../domain/services/detector-duplicidade.service';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import type { IImportacaoPacientesRepository } from '../../../domain/repositories/importacao-repository.interface';
import type {
  ImportarPacientesInputDto,
  LinhaImportacaoDto,
  MapeamentoColunasDto,
} from './importar-pacientes.input.dto';
import type {
  DetalheImportacaoDto,
  ImportarPacientesOutputDto,
} from './importar-pacientes.output.dto';

export type ImportarPacientesDependencies = {
  pacienteRepository: IPacienteRepository;
  importacaoRepository: IImportacaoPacientesRepository;
  detectorDuplicidade: DetectorDuplicidadeService;
};

type LerColunaParams = { linha: LinhaImportacaoDto; coluna?: string };

/**
 * Importa uma planilha previamente convertida em linhas (chave = cabeçalho).
 * Gera o relatório exigido pela spec §3.3: importados, ignorados e erros.
 */
export class ImportarPacientesUseCase extends UseCase<
  ImportarPacientesInputDto,
  ImportarPacientesOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly importacaoRepository: IImportacaoPacientesRepository;
  private readonly detectorDuplicidade: DetectorDuplicidadeService;

  constructor(dependencies: ImportarPacientesDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.importacaoRepository = dependencies.importacaoRepository;
    this.detectorDuplicidade = dependencies.detectorDuplicidade;
  }

  async execute(input: ImportarPacientesInputDto): Promise<Result<ImportarPacientesOutputDto>> {
    const validacao = this.validarMapeamento(input.mapeamento);
    if (validacao.isFailure) return Result.propagate(validacao);

    const detalhes: DetalheImportacaoDto[] = [];
    let importados = 0;
    let ignorados = 0;
    let erros = 0;

    for (let indice = 0; indice < input.linhas.length; indice += 1) {
      const linha = input.linhas[indice];
      const numeroLinha = indice + 2;
      const nome = this.ler({ linha, coluna: input.mapeamento.nome });

      const pacienteResult = Paciente.create({
        redeId: input.redeId,
        nome,
        cpf: this.ler({ linha, coluna: input.mapeamento.cpf }),
        dataNascimento: this.ler({ linha, coluna: input.mapeamento.dataNascimento }),
        sexo: this.ler({ linha, coluna: input.mapeamento.sexo }),
        telefone: this.ler({ linha, coluna: input.mapeamento.telefone }) || null,
        email: this.ler({ linha, coluna: input.mapeamento.email }) || null,
        responsavelNome: this.ler({ linha, coluna: input.mapeamento.responsavelNome }) || null,
        responsavelTelefone:
          this.ler({ linha, coluna: input.mapeamento.responsavelTelefone }) || null,
        observacoes: this.ler({ linha, coluna: input.mapeamento.observacoes }) || null,
        consentimentoLgpd: input.consentimentoLgpd ?? false,
      });

      if (pacienteResult.isFailure) {
        erros += 1;
        detalhes.push({
          linha: numeroLinha,
          nome,
          situacao: 'erro',
          mensagem: pacienteResult.error.message,
        });
        continue;
      }

      const paciente = pacienteResult.value;
      const [porCpf, porNomeENascimento] = await Promise.all([
        this.pacienteRepository.buscarPorCpf({ redeId: input.redeId, cpf: paciente.cpf }),
        this.pacienteRepository.buscarPorNomeENascimento({
          redeId: input.redeId,
          nome: paciente.nome,
          dataNascimento: paciente.dataNascimento,
        }),
      ]);

      const duplicidade = this.detectorDuplicidade.execute({
        cpf: paciente.cpf,
        nome: paciente.nome,
        dataNascimento: paciente.dataNascimento,
        porCpf,
        porNomeENascimento,
      });

      if (duplicidade.isFailure) {
        ignorados += 1;
        detalhes.push({
          linha: numeroLinha,
          nome: paciente.nome,
          situacao: 'ignorado',
          mensagem: duplicidade.error.message,
        });
        continue;
      }

      await this.pacienteRepository.salvar(paciente);
      importados += 1;
      detalhes.push({
        linha: numeroLinha,
        nome: paciente.nome,
        situacao: 'importado',
        mensagem: 'Paciente importado com sucesso',
      });
    }

    const relatorio: ImportarPacientesOutputDto = {
      arquivoNome: input.arquivoNome,
      total: input.linhas.length,
      importados,
      ignorados,
      erros,
      detalhes,
    };

    await this.importacaoRepository.registrar({
      redeId: input.redeId,
      usuarioId: input.usuarioId,
      relatorio,
    });

    return Result.ok(relatorio);
  }

  private validarMapeamento(mapeamento: MapeamentoColunasDto): Result<void> {
    if (!mapeamento.nome || !mapeamento.cpf || !mapeamento.dataNascimento) {
      return Result.fail(
        new Error('É obrigatório mapear as colunas de nome, CPF e data de nascimento'),
      );
    }
    return Result.ok();
  }

  private ler({ linha, coluna }: LerColunaParams): string {
    if (!coluna) return '';
    return (linha[coluna] ?? '').trim();
  }
}
