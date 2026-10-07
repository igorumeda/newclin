import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { PacienteNaoEncontradoError } from '../../../domain/errors/paciente-nao-encontrado.error';
import { PacienteDuplicadoError } from '../../../domain/errors/paciente-duplicado.error';
import type { IPacienteRepository } from '../../../domain/repositories/paciente-repository.interface';
import { PacienteMapper } from '../../mappers/paciente.mapper';
import type { PacienteOutputDto } from '../../mappers/paciente.output.dto';
import type { AtualizarPacienteInputDto } from './atualizar-paciente.input.dto';

export type AtualizarPacienteDependencies = {
  pacienteRepository: IPacienteRepository;
  mapper: PacienteMapper;
};

export class AtualizarPacienteUseCase extends UseCase<
  AtualizarPacienteInputDto,
  PacienteOutputDto
> {
  private readonly pacienteRepository: IPacienteRepository;
  private readonly mapper: PacienteMapper;

  constructor(dependencies: AtualizarPacienteDependencies) {
    super();
    this.pacienteRepository = dependencies.pacienteRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarPacienteInputDto): Promise<Result<PacienteOutputDto>> {
    const paciente = await this.pacienteRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!paciente) return Result.fail(new PacienteNaoEncontradoError({ pacienteId: input.id }));

    const atualizacao = paciente.atualizar(input);
    if (atualizacao.isFailure) return Result.propagate(atualizacao);

    const duplicado = await this.pacienteRepository.buscarPorCpf({
      redeId: input.redeId,
      cpf: paciente.cpf,
      ignorarId: input.id,
    });
    if (duplicado) {
      return Result.fail(
        new PacienteDuplicadoError({ criterio: 'cpf', valor: paciente.cpf.formatado }),
      );
    }

    await this.pacienteRepository.atualizar(paciente);
    return Result.ok(this.mapper.map({ paciente }));
  }
}
