'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Separator } from '@/client/ui/feedback';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from '@/modules/user/domain/value-objects/role.vo';
import { usuarioService } from '@/client/services/usuario.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useAuth } from '@/client/providers/auth-provider';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { formatarDataHora } from '@/client/lib/format';

export default function PerfilPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { perfil, atualizarPerfil, sair } = useAuth();
  const { unidades } = useUnidadeAtiva();

  const usuario = perfil?.usuario ?? null;
  const [nome, setNome] = React.useState('');
  const [telefone, setTelefone] = React.useState('');

  React.useEffect(() => {
    if (!usuario) return;
    setNome(usuario.nome);
    setTelefone(usuario.telefone ?? '');
  }, [usuario]);

  const salvar = useMutation({
    mutationFn: () => usuarioService.atualizar(usuario?.id as string, { nome, telefone: telefone || null }),
    onSuccess: async () => {
      toast.success('Dados atualizados');
      await atualizarPerfil();
      queryClient.invalidateQueries({ queryKey: ['auth', 'perfil'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const permissoes = React.useMemo(() => perfil?.permissoes ?? [], [perfil]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader titulo="Meu perfil" descricao="Dados de acesso, papel na rede e unidades disponíveis." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            Dados pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="perfil-nome">Nome</Label>
            <Input id="perfil-nome" value={nome} onChange={(evento) => setNome(evento.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="perfil-telefone">Telefone</Label>
            <Input
              id="perfil-telefone"
              value={telefone}
              onChange={(evento) => setTelefone(evento.target.value)}
              placeholder="(11) 99999-0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <p className="flex h-11 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              <Mail className="size-4" aria-hidden />
              {usuario?.email}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Último acesso</Label>
            <p className="flex h-11 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              <Phone className="size-4" aria-hidden />
              {usuario?.ultimoAcessoEm ? formatarDataHora(usuario.ultimoAcessoEm) : '—'}
            </p>
          </div>

          <div className="flex justify-end sm:col-span-2">
            <Button
              onClick={() => salvar.mutate()}
              carregando={salvar.isPending}
              disabled={!usuario || nome.trim().length < 3 || nome === usuario.nome && telefone === (usuario.telefone ?? '')}
            >
              <Save aria-hidden />
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
            Papel e permissões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{usuario ? ROLE_LABELS[usuario.role as AppRole] : '—'}</Badge>
            {usuario?.profissionalId ? <Badge variant="secondary">vinculado a profissional</Badge> : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {usuario ? ROLE_DESCRIPTIONS[usuario.role as AppRole] : ''}
          </p>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Permissões efetivas ({permissoes.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {permissoes.map((permissao) => (
                <Badge key={permissao} variant="outline">
                  {permissao}
                </Badge>
              ))}
              {permissoes.length === 0 ? (
                <span className="text-sm text-muted-foreground">Nenhuma permissão atribuída.</span>
              ) : null}
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Unidades disponíveis
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(usuario?.unidadesAcesso.length ? unidades.filter((u) => usuario.unidadesAcesso.includes(u.id)) : unidades).map(
                (unidade) => (
                  <Badge key={unidade.id} variant="secondary">
                    {unidade.nome}
                  </Badge>
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Troque a unidade ativa pelo seletor no topo da página. Suas permissões valem para todas as unidades
              listadas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Encerrar a sessão remove os tokens do navegador e exige novo login.
          </p>
          <Button
            variant="destructive"
            onClick={async () => {
              await sair();
              router.replace('/login');
            }}
          >
            <LogOut aria-hidden />
            Sair do sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
