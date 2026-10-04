'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/client/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/ui/form';
import { Input } from '@/client/ui/input';
import { authService } from '@/client/services/auth.service';
import { ApiError } from '@/client/services/api-client.service';

const esquema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

type FormularioLogin = z.infer<typeof esquema>;

function LoginPageInterno() {
  const router = useRouter();
  const parametros = useSearchParams();
  const queryClient = useQueryClient();
  const [mostrarSenha, setMostrarSenha] = React.useState(false);

  const form = useForm<FormularioLogin>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '', senha: '' },
  });

  async function aoEnviar(dados: FormularioLogin) {
    try {
      const resposta = await authService.login({
        email: dados.email.toLowerCase(),
        senha: dados.senha,
      });
      queryClient.clear();
      queryClient.setQueryData(['auth', 'perfil'], {
        usuario: resposta.usuario,
        permissoes: resposta.permissoes,
      });

      const destino = parametros.get('next') || resposta.redirectTo || '/dashboard';
      toast.success(`Bem-vindo(a), ${resposta.usuario.nome.split(' ')[0]}!`);
      router.replace(destino);
      router.refresh();
    } catch (erro) {
      const mensagem =
        erro instanceof ApiError
          ? erro.message
          : 'Não foi possível entrar. Tente novamente.';
      toast.error(mensagem);
      form.setError('senha', { message: mensagem });
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Entrar na plataforma</CardTitle>
        <CardDescription>
          Acesse com o e-mail cadastrado pela administração da rede.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(aoEnviar)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="nome@clinica.com.br"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-11"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((valor) => !valor)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {mostrarSenha ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Link
                href="/esqueci-senha"
                className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Esqueceu sua senha?
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full"
              carregando={form.formState.isSubmitting}
            >
              <LogIn aria-hidden />
              Entrar
            </Button>
          </form>
        </Form>

        {form.formState.errors.root?.message ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Problemas de acesso? Fale com o administrador da sua rede. <br />
          <Link
            href="/politica-de-privacidade"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Política de privacidade e LGPD
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/** `useSearchParams` exige um limite de Suspense na rota (§App Router). */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Carregando entrar na plataforma…
        </div>
      }
    >
      <LoginPageInterno />
    </Suspense>
  );
}
