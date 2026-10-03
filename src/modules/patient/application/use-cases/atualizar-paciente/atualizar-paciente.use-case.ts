import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteDuplicadoError, PacienteNotFoundError } from '../../../domain/errors/paciente.errors';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { AtualizarPacienteInputDto, AtualizarPacienteOutputDto } from '../../dtos/paciente.dto';

export type AtualizarPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export class AtualizarPacienteUseCase extends UseCase<AtualizarPacienteInputDto, AtualizarPacienteOutputDto> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: AtualizarPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarPacienteInputDto): Promise<Result<AtualizarPacienteOutputDto>> {
    const paciente = await this.pacienteRepository.findById(input.pacienteId);
    if (!paciente) return Result.fail(new PacienteNotFoundError({ pacienteId: input.pacienteId }));

    if (input.cpf && input.cpf.replace(/\D/g, '') !== paciente.cpf.value && !input.ignorarDuplicidade) {
      const duplicados = await this.pacienteRepository.verificarDuplicidade({
        redeId: paciente.redeId,
        cpf: input.cpf,
        nome: input.nome ?? paciente.nome.value,
        dataNascimento:
          input.dataNascimento ?? paciente.dataNascimento.value.toISOString().slice(0, 10),
        ignorarId: paciente.id.toString(),
      });

      if (duplicados.length > 0) return Result.fail(new PacienteDuplicadoError({ detalhes: duplicados }));
    }

    const atualizacao = paciente.atualizar({
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
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.pacienteRepository.update(paciente);

    return Result.ok(this.mapper.map({ paciente }));
  }
}
