import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '../forms/login.form';

export type LoginPageProps = { appNome: string };

export function LoginPage({ appNome }: LoginPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Activity className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{appNome}</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de redes de saúde — agenda, prontuário e documentos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use as credenciais fornecidas pelo administrador da rede.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Acesso monitorado e registrado para fins de auditoria (LGPD).
        </p>
      </div>
    </main>
  );
}
