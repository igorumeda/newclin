export type AlterarSenhaInputDto = {
  redeId: string;
  usuarioId: string;
  senhaAtual?: string;
  novaSenha: string;
  exigirSenhaAtual: boolean;
};
