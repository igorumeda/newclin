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
 * Provisiona o acesso de um usuário à rede ou como Administrador Master:
 * 1. valida e cria a entidade (papel, unidades, vínculo com profissional);
 * 2. envia o convite ou cria o acesso direto com senha inicial no Auth.
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

    const papelEfetivo = (
      input.redeId === null ? 'admin_master' : (input.role ?? 'recepcao')
    ) as AppRole;

    const usuarioResult = Usuario.create({
      redeId: input.redeId,
      nome: input.nome,
      email: input.email,
      role: papelEfetivo,
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
      telefone: usuario.telefone,
      unidadesAcesso: usuario.unidadesAcesso,
      profissionalId: usuario.profissionalId,
      redirectTo: input.appUrl,
      senhaInicial: input.senhaInicial ? input.senhaInicial : undefined,
    });

    // Quando criado com senha inicial (ex.: Administrador Master), garante que o
    // registro em `profiles` esteja persistido caso o trigger ainda não o tenha criado.
    if (!credenciais.conviteEnviado && credenciais.authUserId) {
      const criadoNoTrigger = await this.usuarioRepository.findByEmail(usuario.email);
      if (!criadoNoTrigger) {
        usuario.vincularCredenciais({ authUserId: credenciais.authUserId });
        await this.usuarioRepository.save(usuario);
      }
    }

    return Result.ok({
      conviteEnviado: credenciais.conviteEnviado,
    });
  }
}
