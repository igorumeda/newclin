import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { InvalidUserOperationError } from '../../../domain/errors/user-conflict.error';
import { CadastroConvite } from '../../../domain/value-objects/cadastro-convite.vo';
import type { CadastroConviteParams } from '../../../domain/value-objects/cadastro-convite.vo';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IIdentityProvider } from '../../../domain/services/identity-provider.interface';

export type ConcluirCadastroInput = CadastroConviteParams & {
  usuarioId: string;
  redeId: string;
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
  constructor(private readonly dependencies: ConcluirCadastroDependencies) {
    super();
  }
  async execute(input: ConcluirCadastroInput): Promise<Result<ConcluirCadastroOutput>> {
    const dados = CadastroConvite.create(input);
    if (dados.isFailure) return Result.fail(dados.error);
    const usuario = await this.dependencies.usuarioRepository.findById(input.usuarioId);
    if (
      !usuario ||
      !usuario.ativo ||
      usuario.redeId !== input.redeId ||
      usuario.authUserId !== input.authUserId
    )
      return Result.fail(
        new InvalidUserOperationError({
          reason: 'Convite sem vínculo ativo com a rede.',
        }),
      );
    const atualizado = usuario.alterarDados({
      nome: dados.value.nome,
      telefone: dados.value.telefone,
    });
    if (atualizado.isFailure) return Result.fail(atualizado.error);
    await this.dependencies.usuarioRepository.update(usuario);
    await this.dependencies.identityProvider.atualizarUsuario({
      authUserId: input.authUserId,
      nome: usuario.nome.value,
      email: usuario.email.value,
      redeId: usuario.redeId,
      role: usuario.role.value,
      unidadesAcesso: usuario.unidadesAcesso,
      profissionalId: usuario.profissionalId,
      senha: dados.value.senha,
      cadastroConcluido: true,
    });
    return Result.ok({ concluido: true });
  }
}
