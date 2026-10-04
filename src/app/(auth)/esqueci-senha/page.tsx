'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Email } from '@/modules/user/domain/value-objects/email.vo';
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

const schema = z.object({ email: z.string() }).superRefine((value, context) => {
  const validacao = Email.create(value.email);
  if (validacao.isFailure)
    context.addIssue({
      code: 'custom',
      path: ['email'],
      message: validacao.error.message,
    });
});
type RecuperarSenhaDados = z.infer<typeof schema>;

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = React.useState(false);
  const [erro, setErro] = React.useState('');
  const form = useForm<RecuperarSenhaDados>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });
  async function enviar(dados: RecuperarSenhaDados) {
    setErro('');
    try {
      await recuperacaoSenhaService.solicitar(dados);
      setEnviado(true);
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe o e-mail cadastrado para receber um link e definir uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enviado ? (
          <div role="status" className="space-y-2 text-sm">
            <p>
              Se existir uma conta com esse e-mail, você receberá um link para redefinir
              sua senha.
            </p>
            <p className="text-muted-foreground">
              Confira também a pasta de spam. Abra o link mais recente recebido.
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(enviar)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="recuperar-email">E-mail</Label>
              <Input
                id="recuperar-email"
                type="email"
                autoComplete="email"
                placeholder="nome@clinica.com.br"
                disabled={form.formState.isSubmitting}
                aria-invalid={Boolean(form.formState.errors.email)}
                aria-describedby={
                  form.formState.errors.email ? 'recuperar-email-erro' : undefined
                }
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p
                  id="recuperar-email-erro"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="w-full"
              carregando={form.formState.isSubmitting}
            >
              <Mail aria-hidden />
              Enviar link de recuperação
            </Button>
          </form>
        )}
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        <Link
          href="/login"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Voltar ao login
        </Link>
      </CardContent>
    </Card>
  );
}
