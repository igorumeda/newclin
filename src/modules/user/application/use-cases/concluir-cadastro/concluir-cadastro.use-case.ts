import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { InvalidUserOperationError } from '../../../domain/errors/user-conflict.error';
import { CadastroConvite } from '../../../domain/value-objects/cadastro-convite.vo';
import { Usuario } from '../../../domain/entities/usuario.entity';
import type { CreateUsuarioParams } from '../../../domain/entities/usuario.entity';
import type { CadastroConviteParams } from '../../../domain/value-objects/cadastro-convite.vo';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IIdentityProvider } from '../../../domain/services/identity-provider.interface';

export type ConcluirCadastroInput = CadastroConviteParams & {
  usuarioId?: string;
  convite: CreateUsuarioParams;
  authUserId: string;
};
type ConcluirCadastroDependencies = {
  usuarioRepository: IUsuarioRepository;
  identityProvider: IIdentityProvider;
};
type ConcluirCadastroOutput = { concluido: boolean };

export class ConcluirCadastroUseCase extends UseCase<
  ConcluirCadastroInput,
  ConcluirCadastroOutput
> {
  private readonly dependencies: ConcluirCadastroDependencies;
  constructor(dependencies: ConcluirCadastroDependencies) {
    super();
    this.dependencies = dependencies;
  }
  async execute(input: ConcluirCadastroInput): Promise<Result<ConcluirCadastroOutput>> {
    const dados = CadastroConvite.create(input);
    if (dados.isFailure) return Result.fail(dados.error);
    const existente = input.usuarioId
      ? await this.dependencies.usuarioRepository.findById(input.usuarioId)
      : null;
    if (
      input.usuarioId &&
      (!existente ||
        !existente.ativo ||
        existente.redeId !== input.convite.redeId ||
        existente.authUserId !== input.authUserId)
    )
      return Result.fail(
        new InvalidUserOperationError({
          reason: 'Convite sem vínculo ativo com a rede.',
        }),
      );
    const novo = Usuario.create({
      ...input.convite,
      nome: dados.value.nome,
      telefone: dados.value.telefone,
    });
    if (novo.isFailure) return Result.fail(novo.error);
    const usuario = novo.value;
    if (
      !existente &&
      (await this.dependencies.usuarioRepository.existsByEmail(usuario.email))
    )
      return Result.fail(
        new InvalidUserOperationError({
          reason: 'Este e-mail já possui cadastro na plataforma.',
        }),
      );
    // Senha, flag de conclusão e profile são persistidos na mesma transação do Auth.
    // O trigger cria o profile apenas ao receber cadastro_concluido=true do backend.
    await this.dependencies.identityProvider.atualizarUsuario({
      authUserId: input.authUserId,
      nome: usuario.nome.value,
      email: usuario.email.value,
      redeId: usuario.redeId,
      role: usuario.role.value,
      unidadesAcesso: usuario.unidadesAcesso,
      profissionalId: usuario.profissionalId,
      senha: dados.value.senha,
      telefone: dados.value.telefone,
      cadastroConcluido: true,
    });
    return Result.ok({ concluido: true });
  }
}
