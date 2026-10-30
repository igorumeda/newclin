import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ForbiddenError } from '@core/domain/errors/forbidden.error';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import type {
  ObterResumoMasterInputDto,
  ObterResumoMasterOutputDto,
} from '../../dtos/organizacao.dto';

export type ObterResumoMasterDependencies = {
  redeRepository: IRedeRepository;
};

export class AcessoMasterExigidoError extends ForbiddenError {
  constructor() {
    super({
      message: 'Acesso restrito ao Administrador Master da plataforma.',
      code: 'MASTER_ADMIN_REQUIRED',
    });
    this.name = 'AcessoMasterExigidoError';
  }
}

export class ObterResumoMasterUseCase extends UseCase<
  ObterResumoMasterInputDto,
  ObterResumoMasterOutputDto
> {
  private readonly redeRepository: IRedeRepository;

  constructor(dependencies: ObterResumoMasterDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
  }

  async execute(
    input: ObterResumoMasterInputDto,
  ): Promise<Result<ObterResumoMasterOutputDto>> {
    if (!input.isMaster) {
      return Result.fail(new AcessoMasterExigidoError());
    }

    const resumo = await this.redeRepository.obterResumoMaster();
    return Result.ok(resumo);
  }
}

