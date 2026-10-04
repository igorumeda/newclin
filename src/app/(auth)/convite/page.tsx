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
import { CadastroConvite } from '@/modules/user/domain/value-objects/cadastro-convite.vo';
import { CadastroConviteInvalidoError } from '@/modules/user/domain/errors/cadastro-convite-invalido.error';
import type { CadastroConviteParams } from '@/modules/user/domain/value-objects/cadastro-convite.vo';
import { conviteService } from '@/client/services/convite.service';
import type { ConviteDados } from '@/client/services/convite.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';

const schema = z
  .object({
    nome: z.string(),
    telefone: z.string(),
    senha: z.string(),
    confirmarSenha: z.string(),
  })
  .superRefine((value, context) => {
    const validacao = CadastroConvite.create(value);
    if (validacao.isFailure)
      context.addIssue({
        code: 'custom',
        path: [
          validacao.error instanceof CadastroConviteInvalidoError
            ? validacao.error.field
            : 'root',
        ],
        message: validacao.error.message,
      });
  });

export default function ConvitePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inicializando = React.useRef(false);
  const [dados, setDados] = React.useState<ConviteDados | null>(null);
  const [erro, setErro] = React.useState('');
  const [carregando, setCarregando] = React.useState(true);
  const form = useForm<CadastroConviteParams>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', telefone: '', senha: '', confirmarSenha: '' },
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
        const erroLink = hash.get('error') || query.get('error');
        // Remove credenciais e parâmetros do endereço assim que são lidos.
        window.history.replaceState(null, '', '/convite');
        if (erroLink)
          throw new Error(
            'Convite inválido ou expirado. Peça um novo convite ao administrador.',
          );
        if (access_token && refresh_token)
          await conviteService.validar({ access_token, refresh_token });
        else if (token_hash) await conviteService.validar({ token_hash });
        else if (code) await conviteService.validar({ code });
        const convite = await conviteService.obter();
        setDados(convite);
        form.reset({
          nome: convite.nome,
          telefone: convite.telefone,
          senha: '',
          confirmarSenha: '',
        });
      } catch (error) {
        setErro(mensagemDeErro(error));
      } finally {
        setCarregando(false);
      }
    }
    void inicializar();
  }, [form]);

  async function concluir(value: CadastroConviteParams) {
    try {
      await conviteService.concluir(value);
      queryClient.clear();
      toast.success('Cadastro concluído. Entre com seu e-mail e senha.');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Complete seu cadastro</CardTitle>
        <CardDescription>
          Confirme seus dados e defina a senha de acesso à plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {carregando ? (
          <p role="status" className="text-sm text-muted-foreground">
            Validando convite…
          </p>
        ) : null}
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        {dados ? (
          <form onSubmit={form.handleSubmit(concluir)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="convite-email">E-mail</Label>
              <Input
                id="convite-email"
                type="email"
                value={dados.email}
                readOnly
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="convite-nome">Nome completo</Label>
              <Input
                id="convite-nome"
                aria-invalid={Boolean(form.formState.errors.nome)}
                aria-describedby={
                  form.formState.errors.nome ? 'convite-nome-erro' : undefined
                }
                autoComplete="name"
                disabled={form.formState.isSubmitting}
                {...form.register('nome')}
              />
              {form.formState.errors.nome ? (
                <p
                  id="convite-nome-erro"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.nome.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="convite-telefone">Telefone (opcional)</Label>
              <Input
                id="convite-telefone"
                aria-invalid={Boolean(form.formState.errors.telefone)}
                aria-describedby={
                  form.formState.errors.telefone ? 'convite-telefone-erro' : undefined
                }
                type="tel"
                autoComplete="tel"
                disabled={form.formState.isSubmitting}
                {...form.register('telefone')}
              />
              {form.formState.errors.telefone ? (
                <p
                  id="convite-telefone-erro"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.telefone.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="convite-senha">Senha</Label>
              <Input
                id="convite-senha"
                aria-invalid={Boolean(form.formState.errors.senha)}
                aria-describedby={
                  form.formState.errors.senha
                    ? 'convite-senha-erro'
                    : 'convite-senha-ajuda'
                }
                type="password"
                autoComplete="new-password"
                disabled={form.formState.isSubmitting}
                {...form.register('senha')}
              />
              {form.formState.errors.senha ? (
                <p
                  id="convite-senha-erro"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.senha.message}
                </p>
              ) : null}
              <p id="convite-senha-ajuda" className="text-xs text-muted-foreground">
                Use pelo menos 8 caracteres.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="convite-confirmar">Confirmar senha</Label>
              <Input
                id="convite-confirmar"
                type="password"
                autoComplete="new-password"
                disabled={form.formState.isSubmitting}
                aria-invalid={Boolean(form.formState.errors.confirmarSenha)}
                aria-describedby={
                  form.formState.errors.confirmarSenha ? 'convite-erro' : undefined
                }
                {...form.register('confirmarSenha')}
              />
              {form.formState.errors.confirmarSenha ? (
                <p id="convite-erro" role="alert" className="text-sm text-destructive">
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
              Concluir cadastro
            </Button>
          </form>
        ) : null}
        {!carregando && !dados ? (
          <Link href="/login" className="text-sm text-primary underline">
            Voltar ao login
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
