'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Mail, MoreHorizontal, Pencil, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Checkbox } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { DataTable } from '@/client/ui/data-table';
import { Alert, AlertDescription, EstadoVazio } from '@/client/ui/feedback';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/client/ui/overlay';
import { usuarioService } from '@/client/services/usuario.service';
import { profissionalService } from '@/client/services/profissional.service';
import { organizacaoService } from '@/client/services/organizacao.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useDebounce } from '@/client/hooks/use-debounce';
import { formatarDataHora } from '@/client/lib/format';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_VALUES, type AppRole } from '@/modules/user/domain/value-objects/role.vo';
import type { UsuarioDto } from '@/client/services/usuario.service';

type FormularioUsuario = {
  nome: string;
  email: string;
  role: AppRole;
  telefone: string;
  profissionalId: string;
};

const FORMULARIO_VAZIO: FormularioUsuario = {
  nome: '',
  email: '',
  role: 'recepcao',
  telefone: '',
  profissionalId: '',
};

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = React.useState('');
  const [roleFiltro, setRoleFiltro] = React.useState('todas');
  const [incluirInativos, setIncluirInativos] = React.useState(false);
  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [emEdicao, setEmEdicao] = React.useState<UsuarioDto | null>(null);
  const [formulario, setFormulario] = React.useState<FormularioUsuario>(FORMULARIO_VAZIO);
  const [unidadesAcesso, setUnidadesAcesso] = React.useState<string[]>([]);
  const [inativando, setInativando] = React.useState<UsuarioDto | null>(null);

  const buscaDebounced = useDebounce(busca, 400);

  const consulta = useQuery({
    queryKey: ['usuarios', { buscaDebounced, roleFiltro, incluirInativos }],
    queryFn: () =>
      usuarioService.listar({
        busca: buscaDebounced || undefined,
        role: roleFiltro === 'todas' ? undefined : roleFiltro,
        ativo: incluirInativos ? undefined : true,
      }),
  });

  const unidades = useQuery({
    queryKey: ['organizacao', 'unidades', { ativo: true }],
    queryFn: () => organizacaoService.listarUnidades({ ativo: true }),
  });

  const profissionais = useQuery({
    queryKey: ['profissionais', { ativo: true }],
    queryFn: () => profissionalService.listar({ ativo: true }),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (emEdicao) {
        return usuarioService.atualizar(emEdicao.id, {
          nome: formulario.nome,
          telefone: formulario.telefone || null,
          role: formulario.role,
          unidadesAcesso,
          profissionalId: formulario.profissionalId || null,
        });
      }

      return usuarioService.criar({
        nome: formulario.nome,
        email: formulario.email,
        role: formulario.role,
        telefone: formulario.telefone || null,
        unidadesAcesso,
        profissionalId: formulario.profissionalId || null,
      });
    },
    onSuccess: () => {
      toast.success(
        emEdicao ? 'Usuário atualizado' : 'Convite enviado — o usuário receberá o e-mail de primeiro acesso',
      );
      setDialogoAberto(false);
      setEmEdicao(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacao = useMutation({
    mutationFn: (usuario: UsuarioDto) =>
      usuario.ativo ? usuarioService.inativar(usuario.id) : usuarioService.reativar(usuario.id),
    onSuccess: (usuario) => {
      toast.success(usuario.ativo ? 'Usuário reativado' : 'Usuário inativado');
      setInativando(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirNovo() {
    setEmEdicao(null);
    setFormulario(FORMULARIO_VAZIO);
    setUnidadesAcesso(unidades.data?.map((unidade) => unidade.id) ?? []);
    setDialogoAberto(true);
  }

  function abrirEdicao(usuario: UsuarioDto) {
    setEmEdicao(usuario);
    setFormulario({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role as AppRole,
      telefone: usuario.telefone ?? '',
      profissionalId: usuario.profissionalId ?? '',
    });
    setUnidadesAcesso(usuario.unidadesAcesso);
    setDialogoAberto(true);
  }

  const colunas = React.useMemo<ColumnDef<UsuarioDto, unknown>[]>(
    () => [
      {
        id: 'nome',
        header: 'Usuário',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.nome}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: 'papel',
        header: 'Papel',
        cell: ({ row }) => <Badge variant="secondary">{row.original.roleLabel}</Badge>,
      },
      {
        id: 'unidades',
        header: 'Unidades',
        cell: ({ row }) =>
          row.original.unidadesAcesso.length === 0 ? (
            <span className="text-xs text-muted-foreground">todas</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {row.original.unidadesAcesso.slice(0, 3).map((unidadeId) => (
                <Badge key={unidadeId} variant="outline">
                  {unidades.data?.find((unidade) => unidade.id === unidadeId)?.nome ?? 'unidade'}
                </Badge>
              ))}
              {row.original.unidadesAcesso.length > 3 ? (
                <Badge variant="outline">+{row.original.unidadesAcesso.length - 3}</Badge>
              ) : null}
            </div>
          ),
      },
      {
        id: 'profissional',
        header: 'Profissional',
        cell: ({ row }) =>
          row.original.profissionalId ? (
            <span className="text-sm">
              {profissionais.data?.items.find((item) => item.id === row.original.profissionalId)?.nome ?? '—'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: 'acesso',
        header: 'Último acesso',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.ultimoAcessoEm ? formatarDataHora(row.original.ultimoAcessoEm) : 'nunca acessou'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.ativo ? 'success' : 'secondary'}>
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Ações de ${row.original.nome}`}>
                  <MoreHorizontal aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => abrirEdicao(row.original)}>
                  <Pencil aria-hidden />
                  Editar permissões
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variante="destructive" onClick={() => setInativando(row.original)}>
                  {row.original.ativo ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
                  {row.original.ativo ? 'Inativar acesso' : 'Reativar acesso'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.data, profissionais.data],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Usuários e permissões"
        descricao="Cada usuário recebe um papel e o conjunto de unidades que pode acessar. A recepção nunca acessa o conteúdo clínico."
        acoes={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden />
            Convidar usuário
          </Button>
        }
      />

      <Alert variant="info">
        <AlertDescription className="flex items-start gap-2">
          <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            O convite cria a conta no Supabase Auth e envia um e-mail com link para definição de senha. Sem SMTP
            configurado, o administrador pode gerar a senha manualmente no painel do Supabase.
          </span>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:p-4 sm:flex-row sm:items-center">
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="flex-1"
            aria-label="Buscar usuários"
          />
          <Select value={roleFiltro} onValueChange={setRoleFiltro}>
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os papéis</SelectItem>
              {ROLE_VALUES.map((papel) => (
                <SelectItem key={papel} value={papel}>
                  {ROLE_LABELS[papel]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={incluirInativos} onCheckedChange={(valor) => setIncluirInativos(valor === true)} />
            Incluir inativos
          </label>
        </CardContent>
      </Card>

      <DataTable
        colunas={colunas}
        dados={consulta.data?.items ?? []}
        carregando={consulta.isLoading}
        estadoVazio={
          <EstadoVazio
            titulo="Nenhum usuário encontrado"
            descricao="Convide a equipe informando papel e unidades de acesso."
            icone={ShieldCheck}
          />
        }
      />

      <Dialog
        open={dialogoAberto}
        onOpenChange={(aberto) => {
          setDialogoAberto(aberto);
          if (!aberto) setEmEdicao(null);
        }}
      >
        <DialogContent tamanho="md">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar usuário' : 'Convidar usuário'}</DialogTitle>
            <DialogDescription>{ROLE_DESCRIPTIONS[formulario.role]}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="usuario-nome">Nome completo *</Label>
              <Input
                id="usuario-nome"
                value={formulario.nome}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nome: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="usuario-email">E-mail *</Label>
              <Input
                id="usuario-email"
                type="email"
                value={formulario.email}
                disabled={Boolean(emEdicao)}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, email: evento.target.value }))}
                placeholder="nome@clinica.com.br"
              />
              {emEdicao ? (
                <p className="text-xs text-muted-foreground">O e-mail de acesso não pode ser alterado.</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Papel *</Label>
              <Select
                value={formulario.role}
                onValueChange={(valor) =>
                  setFormulario((anterior) => ({ ...anterior, role: valor as AppRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_VALUES.map((papel) => (
                    <SelectItem key={papel} value={papel}>
                      {ROLE_LABELS[papel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usuario-telefone">Telefone</Label>
              <Input
                id="usuario-telefone"
                value={formulario.telefone}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, telefone: evento.target.value }))}
              />
            </div>

            {formulario.role === 'profissional' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Vínculo com profissional</Label>
                <Select
                  value={formulario.profissionalId}
                  onValueChange={(valor) => setFormulario((anterior) => ({ ...anterior, profissionalId: valor }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {(profissionais.data?.items ?? []).map((profissional) => (
                      <SelectItem key={profissional.id} value={profissional.id}>
                        {profissional.nome} — {profissional.registroFormatado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O vínculo permite abrir o prontuário em nome do profissional e assinar documentos.
                </p>
              </div>
            ) : null}

            <div className="space-y-2 sm:col-span-2">
              <Label>Unidades de acesso</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(unidades.data ?? []).map((unidade) => (
                  <label key={unidade.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <Checkbox
                      checked={unidadesAcesso.includes(unidade.id)}
                      onCheckedChange={(marcado) =>
                        setUnidadesAcesso((anterior) =>
                          marcado === true
                            ? [...anterior, unidade.id]
                            : anterior.filter((item) => item !== unidade.id),
                        )
                      }
                    />
                    {unidade.nome}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Sem nenhuma unidade marcada o usuário acessa todas as unidades da rede.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvar.mutate()}
              carregando={salvar.isPending}
              disabled={
                formulario.nome.trim().length < 3 || (!emEdicao && !/^\S+@\S+\.\S+$/.test(formulario.email))
              }
            >
              {emEdicao ? 'Salvar alterações' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(inativando)}
        aoMudar={(aberto) => !aberto && setInativando(null)}
        titulo={inativando?.ativo ? 'Inativar acesso' : 'Reativar acesso'}
        descricao={
          inativando?.ativo
            ? `${inativando?.nome} perde o acesso imediatamente. O histórico de auditoria das ações do usuário é mantido.`
            : `${inativando?.nome} volta a conseguir entrar no sistema com o mesmo papel.`
        }
        textoConfirmar={inativando?.ativo ? 'Inativar' : 'Reativar'}
        carregando={alterarSituacao.isPending}
        onConfirmar={() => inativando && alterarSituacao.mutate(inativando)}
      />
    </div>
  );
}
