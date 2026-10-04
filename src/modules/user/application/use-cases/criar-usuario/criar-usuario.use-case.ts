import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Email } from '../../../domain/value-objects/email.vo';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { EmailAlreadyInUseError } from '../../../domain/errors/user-conflict.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IIdentityProvider } from '../../../domain/services/identity-provider.interface';
import type { AppRole } from '../../../domain/value-objects/role.vo';
import type { CriarUsuarioInputDto } from './criar-usuario.input.dto';
import type { CriarUsuarioOutputDto } from './criar-usuario.output.dto';

export type CriarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  identityProvider: IIdentityProvider;
};

/**
 * Provisiona o acesso de um usuário à rede:
 * 1. valida e cria a entidade (papel, unidades, vínculo com profissional);
 * 2. envia o convite, sem persistir um usuário na plataforma.
 * O profile é criado somente na conclusão do cadastro.
 */
export class CriarUsuarioUseCase extends UseCase<
  CriarUsuarioInputDto,
  CriarUsuarioOutputDto
> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly identityProvider: IIdentityProvider;

  constructor(dependencies: CriarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.identityProvider = dependencies.identityProvider;
  }

  async execute(input: CriarUsuarioInputDto): Promise<Result<CriarUsuarioOutputDto>> {
    const emailResult = Email.create(input.email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    const jaExiste = await this.usuarioRepository.existsByEmail(emailResult.value);
    if (jaExiste) {
      return Result.fail(new EmailAlreadyInUseError({ email: emailResult.value.value }));
    }

    const usuarioResult = Usuario.create({
      redeId: input.redeId,
      nome: input.nome,
      email: input.email,
      role: input.role as AppRole,
      telefone: input.telefone ?? null,
      unidadesAcesso: input.unidadesAcesso ?? [],
      profissionalId: input.profissionalId ?? null,
    });
    if (usuarioResult.isFailure) return Result.fail(usuarioResult.error);

    const usuario = usuarioResult.value;

    const credenciais = await this.identityProvider.criarUsuario({
      email: usuario.email.value,
      nome: usuario.nome.value,
      redeId: usuario.redeId,
      role: usuario.role.value,
      unidadesAcesso: usuario.unidadesAcesso,
      profissionalId: usuario.profissionalId,
      redirectTo: input.appUrl,
    });

    return Result.ok({
      conviteEnviado: credenciais.conviteEnviado,
    });
  }
}
