'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/client/ui/forms/form-field.component';
import { Email } from '../../../domain/value-objects/email.vo';
import { authApiService } from '../../services/auth-api.service';

export type ErrosLogin = { email?: string; senha?: string };
export type ValidarLoginParams = { email: string; senha: string };
export type ResultadoValidacaoLogin = { valido: boolean; erros: ErrosLogin };

/** Reaproveita o Value Object do domínio para validar no cliente (§6.2). */
export function validarFormularioLogin(dados: ValidarLoginParams): ResultadoValidacaoLogin {
  const erros: ErrosLogin = {};
  const emailResult = Email.create(dados.email);
  if (emailResult.isFailure) erros.email = emailResult.error.message;
  if (!dados.senha || dados.senha.length < 8) {
    erros.senha = 'A senha deve ter no mínimo 8 caracteres';
  }
  return { valido: Object.keys(erros).length === 0, erros };
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ErrosLogin>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    const validacao = validarFormularioLogin({ email, senha });
    setErros(validacao.erros);
    if (!validacao.valido) return;

    setEnviando(true);
    try {
      const sessao = await authApiService.entrar({ email, senha });
      toast.success(`Bem-vindo(a), ${sessao.usuario.nome}`);
      router.push('/dashboard');
      router.refresh();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não foi possível entrar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <FormField rotulo="E-mail" erro={erros.email} obrigatorio>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="voce@clinica.com.br"
        />
      </FormField>

      <FormField rotulo="Senha" erro={erros.senha} obrigatorio>
        <Input
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Entrar
      </Button>
    </form>
  );
}
