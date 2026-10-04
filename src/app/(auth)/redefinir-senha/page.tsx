'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Senha } from '@/modules/user/domain/value-objects/senha.vo';
import type { SenhaParams } from '@/modules/user/domain/value-objects/senha.vo';
import { SenhaInvalidaError } from '@/modules/user/domain/errors/senha-invalida.error';
import { recuperacaoSenhaService } from '@/client/services/recuperacao-senha.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/client/ui/card';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Button } from '@/client/ui/button';

const schema = z
  .object({ senha: z.string(), confirmarSenha: z.string() })
  .superRefine((value, context) => {
    const validacao = Senha.create(value);
    if (validacao.isFailure)
      context.addIssue({
        code: 'custom',
        path: [
          validacao.error instanceof SenhaInvalidaError ? validacao.error.field : 'senha',
        ],
        message: validacao.error.message,
      });
  });

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inicializando = React.useRef(false);
  const [email, setEmail] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState('');
  const form = useForm<SenhaParams>({
    resolver: zodResolver(schema),
    defaultValues: { senha: '', confirmarSenha: '' },
  });
  React.useEffect(() => {
    if (inicializando.current) return;
    inicializando.current = true;
    async function inicializar() {
      try {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const query = new URLSearchParams(window.location.search);
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');
        const token_hash = query.get('token_hash');
        const code = query.get('code');
        const error = hash.get('error') || query.get('error');
        window.history.replaceState(null, '', '/redefinir-senha');
        if (error)
          throw new Error(
            'Link inválido ou expirado. Solicite um novo link para redefinir sua senha.',
          );
        if (access_token && refresh_token)
          await recuperacaoSenhaService.validar({ access_token, refresh_token });
        else if (token_hash) await recuperacaoSenhaService.validar({ token_hash });
        else if (code) await recuperacaoSenhaService.validar({ code });
        const dados = await recuperacaoSenhaService.obter();
        setEmail(dados.email);
      } catch (error) {
        setErro(mensagemDeErro(error));
      } finally {
        setCarregando(false);
      }
    }
    void inicializar();
  }, []);
  async function salvar(dados: SenhaParams) {
    setErro('');
    try {
      await recuperacaoSenhaService.redefinir(dados);
      queryClient.clear();
      toast.success('Senha atualizada. Entre com sua nova senha.');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Definir nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha para acessar sua conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando ? (
          <p role="status" className="text-sm text-muted-foreground">
            Validando link…
          </p>
        ) : null}
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        {email ? (
          <form onSubmit={form.handleSubmit(salvar)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="redefinir-email">E-mail</Label>
              <Input
                id="redefinir-email"
                type="email"
                value={email}
                readOnly
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <Input
                id="nova-senha"
                type="password"
                autoComplete="new-password"
                disabled={form.formState.isSubmitting}
                aria-invalid={Boolean(form.formState.errors.senha)}
                aria-describedby={
                  form.formState.errors.senha ? 'nova-senha-erro' : 'nova-senha-ajuda'
                }
                {...form.register('senha')}
              />
              <p id="nova-senha-ajuda" className="text-xs text-muted-foreground">
                Use pelo menos 8 caracteres.
              </p>
              {form.formState.errors.senha ? (
                <p id="nova-senha-erro" role="alert" className="text-sm text-destructive">
                  {form.formState.errors.senha.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nova-confirmacao">Confirmar nova senha</Label>
              <Input
                id="nova-confirmacao"
                type="password"
                autoComplete="new-password"
                disabled={form.formState.isSubmitting}
                aria-invalid={Boolean(form.formState.errors.confirmarSenha)}
                aria-describedby={
                  form.formState.errors.confirmarSenha
                    ? 'nova-confirmacao-erro'
                    : undefined
                }
                {...form.register('confirmarSenha')}
              />
              {form.formState.errors.confirmarSenha ? (
                <p
                  id="nova-confirmacao-erro"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.confirmarSenha.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full"
              carregando={form.formState.isSubmitting}
            >
              <Save aria-hidden />
              Salvar nova senha
            </Button>
          </form>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {!carregando && !email ? (
            <Link
              href="/esqueci-senha"
              className="text-sm text-primary underline underline-offset-4"
            >
              Solicitar novo link
            </Link>
          ) : null}
          <Link
            href="/login"
            className="text-sm text-primary underline underline-offset-4"
          >
            Voltar ao login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
