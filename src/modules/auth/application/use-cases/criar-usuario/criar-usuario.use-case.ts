import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Senha } from '../../../domain/value-objects/senha.vo';
import { EmailJaCadastradoError } from '../../../domain/errors/email-ja-cadastrado.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IHashProvider } from '../../../domain/services/hash-provider.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioOutputDto } from '../../mappers/usuario.output.dto';
import type { CriarUsuarioInputDto } from './criar-usuario.input.dto';

export type CriarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  hashProvider: IHashProvider;
  mapper: UsuarioMapper;
};

export class CriarUsuarioUseCase extends UseCase<CriarUsuarioInputDto, UsuarioOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly hashProvider: IHashProvider;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: CriarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.hashProvider = dependencies.hashProvider;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarUsuarioInputDto): Promise<Result<UsuarioOutputDto>> {
    const emailResult = Email.create(input.email);
    if (emailResult.isFailure) return Result.propagate(emailResult);

    const senhaResult = Senha.create(input.senha);
    if (senhaResult.isFailure) return Result.propagate(senhaResult);

    const emailEmUso = await this.usuarioRepository.existeEmail({ email: emailResult.value });
    if (emailEmUso) return Result.fail(new EmailJaCadastradoError({ email: emailResult.value.value }));

    const senhaHash = await this.hashProvider.hash({ plain: senhaResult.value.value });

    const usuarioResult = Usuario.create({
      redeId: input.redeId,
      nome: input.nome,
      email: input.email,
      senhaHash,
      papel: input.role,
      unidadesAcesso: input.unidadesAcesso,
      profissionalId: input.profissionalId ?? null,
      telefone: input.telefone ?? null,
    });
    if (usuarioResult.isFailure) return Result.propagate(usuarioResult);

    await this.usuarioRepository.salvar(usuarioResult.value);

    return Result.ok(this.mapper.map({ usuario: usuarioResult.value }));
  }
}
