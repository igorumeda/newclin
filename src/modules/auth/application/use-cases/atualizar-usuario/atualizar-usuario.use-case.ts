import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Email } from '../../../domain/value-objects/email.vo';
import { EmailJaCadastradoError } from '../../../domain/errors/email-ja-cadastrado.error';
import { UsuarioNaoEncontradoError } from '../../../domain/errors/usuario-nao-encontrado.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioOutputDto } from '../../mappers/usuario.output.dto';
import type { AtualizarUsuarioInputDto } from './atualizar-usuario.input.dto';

export type AtualizarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class AtualizarUsuarioUseCase extends UseCase<AtualizarUsuarioInputDto, UsuarioOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: AtualizarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarUsuarioInputDto): Promise<Result<UsuarioOutputDto>> {
    const usuario = await this.usuarioRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!usuario) return Result.fail(new UsuarioNaoEncontradoError({ usuarioId: input.id }));

    if (input.email) {
      const emailResult = Email.create(input.email);
      if (emailResult.isFailure) return Result.propagate(emailResult);
      const emEmUso = await this.usuarioRepository.existeEmail({
        email: emailResult.value,
        ignorarId: input.id,
      });
      if (emEmUso) return Result.fail(new EmailJaCadastradoError({ email: input.email }));
    }

    const atualizacaoResult = usuario.atualizar({
      nome: input.nome,
      email: input.email,
      papel: input.role,
      unidadesAcesso: input.unidadesAcesso,
      profissionalId: input.profissionalId,
      telefone: input.telefone,
    });
    if (atualizacaoResult.isFailure) return Result.propagate(atualizacaoResult);

    await this.usuarioRepository.atualizar(usuario);
    return Result.ok(this.mapper.map({ usuario }));
  }
}
