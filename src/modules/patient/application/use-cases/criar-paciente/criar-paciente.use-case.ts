import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Paciente } from '../../../domain/entities/paciente.entity';
import { PacienteDuplicadoError } from '../../../domain/errors/paciente.errors';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { CriarPacienteInputDto, CriarPacienteOutputDto } from '../../dtos/paciente.dto';

export type CriarPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export class CriarPacienteUseCase extends UseCase<CriarPacienteInputDto, CriarPacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: CriarPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarPacienteInputDto): Promise<Result<CriarPacienteOutputDto>> {
    const pacienteResult = Paciente.create({
      redeId: input.redeId,
      nome: input.nome,
      cpf: input.cpf,
      dataNascimento: input.dataNascimento,
      sexo: input.sexo,
      contato: {
        telefone: input.telefone,
        email: input.email,
        responsavelNome: input.responsavelNome,
        responsavelTelefone: input.responsavelTelefone,
        responsavelParentesco: input.responsavelParentesco,
      },
      endereco: input.endereco,
      alergias: input.alergias,
      condicoesCronicas: input.condicoesCronicas,
      observacoes: input.observacoes,
      consentimentoLgpd: input.consentimentoLgpd,
      consentimentoOrigem: input.consentimentoOrigem,
      importado: input.importado,
    });
    if (pacienteResult.isFailure) return Result.fail(pacienteResult.error);

    const paciente = pacienteResult.value;

    if (!input.ignorarDuplicidade) {
      const duplicados = await this.pacienteRepository.verificarDuplicidade({
        redeId: input.redeId,
        cpf: paciente.cpf.value,
        nome: paciente.nome.value,
        dataNascimento: paciente.dataNascimento.value.toISOString().slice(0, 10),
      });

      if (duplicados.length > 0) {
        return Result.fail(new PacienteDuplicadoError({ detalhes: duplicados }));
      }
    }

    await this.pacienteRepository.save(paciente);

    return Result.ok(this.mapper.map({ paciente }));
  }
}
