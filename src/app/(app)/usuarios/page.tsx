'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import { Checkbox, Label } from '@/client/ui/controls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/ui/select';
import { DataTable } from '@/client/ui/data-table';
import { Alert, AlertDescription, EstadoVazio } from '@/client/ui/feedback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/ui/dialog';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/client/ui/overlay';
import { usuarioService, type UsuarioDto } from '@/client/services/usuario.service';
import { profissionalService } from '@/client/services/profissional.service';
import { organizacaoService } from '@/client/services/organizacao.service';
import { masterService } from '@/client/services/master.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useAuth } from '@/client/providers/auth-provider';
import { useDebounce } from '@/client/hooks/use-debounce';
import { formatarDataHora } from '@/client/lib/format';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_VALUES,
  type AppRole,
  type TenantRole,
} from '@/modules/user/domain/value-objects/role.vo';

const ESCOPO_MASTER = '__master__';

type FormularioUsuario = {
  escopoRedeId: string;
  nome: string;
  email: string;
  role: TenantRole;
  telefone: string;
  profissionalId: string;
  senhaInicial: string;
};

const FORMULARIO_VAZIO: FormularioUsuario = {
  escopoRedeId: ESCOPO_MASTER,
  nome: '',
  email: '',
  role: 'admin_rede',
  telefone: '',
  profissionalId: '',
  senhaInicial: '',
};

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const { ehMaster, usuarioId: usuarioAtualId } = useAuth();
  const [busca, setBusca] = React.useState('');
  const [escopoFiltroMaster, setEscopoFiltroMaster] = React.useState<string>(ESCOPO_MASTER);
  const [roleFiltro, setRoleFiltro] = React.useState('todas');
  const [incluirInativos, setIncluirInativos] = React.useState(false);
  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [emEdicao, setEmEdicao] = React.useState<UsuarioDto | null>(null);
  const [formulario, setFormulario] = React.useState<FormularioUsuario>(FORMULARIO_VAZIO);
  const [unidadesAcesso, setUnidadesAcesso] = React.useState<string[]>([]);
  const [inativando, setInativando] = React.useState<UsuarioDto | null>(null);

  const buscaDebounced = useDebounce(busca, 400);

  const redesMaster = useQuery({
    queryKey: ['master', 'redes', 'resumo'],
    queryFn: () => masterService.obterResumoRedes(),
    enabled: ehMaster,
  });

  const redeIdSelecionadaMaster =
    ehMaster && escopoFiltroMaster !== ESCOPO_MASTER ? escopoFiltroMaster : undefined;

  const consulta = useQuery({
    queryKey: [
      'usuarios',
      {
        ehMaster,
        redeIdSelecionadaMaster,
        buscaDebounced,
        roleFiltro,
        incluirInativos,
      },
    ],
    queryFn: () =>
      usuarioService.listar({
        redeId: redeIdSelecionadaMaster,
        busca: buscaDebounced || undefined,
        role:
          (ehMaster && !redeIdSelecionadaMaster) || roleFiltro === 'todas'
            ? undefined
            : roleFiltro,
        ativo: incluirInativos ? undefined : true,
      }),
  });

  const unidades = useQuery({
    queryKey: ['organizacao', 'unidades', { ativo: true }],
    queryFn: () => organizacaoService.listarUnidades({ ativo: true }),
    enabled: !ehMaster,
  });

  const profissionais = useQuery({
    queryKey: ['profissionais', { ativo: true }],
    queryFn: () => profissionalService.listar({ ativo: true }),
    enabled: !ehMaster,
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (emEdicao) {
        return usuarioService.atualizar(emEdicao.id, {
          nome: formulario.nome,
          telefone: formulario.telefone || null,
          ...(emEdicao.isMaster
            ? {}
            : {
                role: formulario.role,
                ...(ehMaster
                  ? {}
                  : {
                      unidadesAcesso,
                      profissionalId: formulario.profissionalId || null,
                    }),
              }),
        });
      }

      if (ehMaster) {
        const criandoMaster = formulario.escopoRedeId === ESCOPO_MASTER;
        return usuarioService.criar({
          redeId: criandoMaster ? null : formulario.escopoRedeId,
          nome: formulario.nome,
          email: formulario.email,
          role: criandoMaster ? 'admin_master' : formulario.role,
          telefone: formulario.telefone || null,
          senhaInicial: formulario.senhaInicial.trim() || null,
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
    onSuccess: (resultado) => {
      if (emEdicao) {
        toast.success('Usuário atualizado');
      } else if ('conviteEnviado' in resultado && resultado.conviteEnviado === false) {
        toast.success('Usuário criado e ativo para login imediato');
      } else {
        toast.success(
          'Convite enviado — o usuário receberá o e-mail de primeiro acesso',
        );
      }
      setDialogoAberto(false);
      setEmEdicao(null);
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      if (ehMaster) {
        void queryClient.invalidateQueries({ queryKey: ['master', 'redes', 'resumo'] });
      }
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacao = useMutation({
    mutationFn: (usuario: UsuarioDto) =>
      usuario.ativo ? usuarioService.inativar(usuario.id) : usuarioService.reativar(usuario.id),
    onSuccess: (usuario) => {
      toast.success(usuario.ativo ? 'Usuário reativado' : 'Usuário inativado');
      setInativando(null);
      void queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      if (ehMaster) {
        void queryClient.invalidateQueries({ queryKey: ['master', 'redes', 'resumo'] });
      }
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirNovo() {
    setEmEdicao(null);
    setFormulario({
      ...FORMULARIO_VAZIO,
      escopoRedeId: ehMaster ? escopoFiltroMaster : '',
      role: ehMaster ? 'admin_rede' : 'recepcao',
    });
    setUnidadesAcesso(ehMaster ? [] : (unidades.data?.map((unidade) => unidade.id) ?? []));
    setDialogoAberto(true);
  }

  function abrirEdicao(usuario: UsuarioDto) {
    setEmEdicao(usuario);
    setFormulario({
      escopoRedeId: usuario.redeId ?? ESCOPO_MASTER,
      nome: usuario.nome,
      email: usuario.email,
      role: (ROLE_VALUES.includes(usuario.role as TenantRole)
        ? usuario.role
        : 'admin_rede') as TenantRole,
      telefone: usuario.telefone ?? '',
      profissionalId: usuario.profissionalId ?? '',
      senhaInicial: '',
    });
    setUnidadesAcesso(usuario.unidadesAcesso);
    setDialogoAberto(true);
  }

  const listaRedes = React.useMemo(
    () => redesMaster.data?.redes ?? [],
    [redesMaster.data?.redes],
  );

  const colunas = React.useMemo<ColumnDef<UsuarioDto, unknown>[]>(() => {
    const base: ColumnDef<UsuarioDto, unknown>[] = [
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
        cell: ({ row }) => (
          <Badge variant={row.original.isMaster ? 'default' : 'secondary'}>
            {row.original.roleLabel}
          </Badge>
        ),
      },
    ];

    if (ehMaster) {
      base.push(
        {
          id: 'rede',
          header: 'Escopo / Rede',
          cell: ({ row }) => {
            if (!row.original.redeId) {
              return (
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck className="size-3" aria-hidden />
                  Global (Master)
                </Badge>
              );
            }
            const rede = listaRedes.find((item) => item.id === row.original.redeId);
            return (
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Building2 className="size-3.5 text-muted-foreground" aria-hidden />
                {rede?.nome ?? 'Rede vinculada'}
              </span>
            );
          },
        },
        {
          id: 'telefone',
          header: 'Telefone',
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
              {row.original.telefone ?? '—'}
            </span>
          ),
        },
      );
    } else {
      base.push(
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
      );
    }

    base.push(
      {
        id: 'acesso',
        header: 'Último acesso',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.ultimoAcessoEm
              ? formatarDataHora(row.original.ultimoAcessoEm)
              : 'nunca acessou'}
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
        cell: ({ row }) => {
          const ehProprioUsuario = row.original.id === usuarioAtualId;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Ações de ${row.original.nome}`}
                  >
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => abrirEdicao(row.original)}>
                    <Pencil aria-hidden />
                    {row.original.isMaster ? 'Editar dados' : 'Editar permissões'}
                  </DropdownMenuItem>
                  {!ehProprioUsuario ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variante="destructive"
                        onClick={() => setInativando(row.original)}
                      >
                        {row.original.ativo ? (
                          <Trash2 aria-hidden />
                        ) : (
                          <RotateCcw aria-hidden />
                        )}
                        {row.original.ativo ? 'Inativar acesso' : 'Reativar acesso'}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    );

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehMaster, listaRedes, unidades.data, profissionais.data, usuarioAtualId]);

  const formularioEhMasterGlobal =
    ehMaster &&
    (emEdicao ? emEdicao.isMaster : formulario.escopoRedeId === ESCOPO_MASTER);

  const senhaInicialInvalida =
    !emEdicao &&
    ehMaster &&
    formulario.senhaInicial.trim().length > 0 &&
    formulario.senhaInicial.trim().length < 6;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={ehMaster ? 'Gestão de Usuários — Master & Redes' : 'Usuários e permissões'}
        descricao={
          ehMaster
            ? 'Gerencie Administradores Master (sem rede vinculada) ou crie e administre usuários vinculados a qualquer rede cadastrada na plataforma.'
            : 'Cada usuário recebe um papel e o conjunto de unidades que pode acessar. A recepção nunca acessa o conteúdo clínico.'
        }
        acoes={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden />
            {ehMaster ? 'Novo usuário' : 'Convidar usuário'}
          </Button>
        }
      />

      <Alert variant="info">
        <AlertDescription className="flex items-start gap-2">
          <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {ehMaster
              ? 'Pelo painel Master você pode criar tanto novos Administradores Master (rede_id nulo) quanto usuários vinculados a uma rede específica (Admin da Rede, Gestor, Profissional ou Recepção), com convite por e-mail ou senha inicial imediata.'
              : 'O convite cria a conta no Supabase Auth e envia um e-mail com link para definição de senha. Sem SMTP configurado, o administrador pode gerar a senha manualmente no painel do Supabase.'}
          </span>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-4">
          {ehMaster ? (
            <Select
              value={escopoFiltroMaster}
              onValueChange={(valor) => {
                setEscopoFiltroMaster(valor);
                setRoleFiltro('todas');
              }}
            >
              <SelectTrigger className="sm:w-72" aria-label="Filtrar por escopo ou rede">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ESCOPO_MASTER}>
                  Administradores Master (sem rede)
                </SelectItem>
                {listaRedes.map((rede) => (
                  <SelectItem key={rede.id} value={rede.id}>
                    Rede: {rede.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="flex-1"
            aria-label="Buscar usuários"
          />

          {!ehMaster || redeIdSelecionadaMaster ? (
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
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={incluirInativos}
              onCheckedChange={(valor) => setIncluirInativos(valor === true)}
            />
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
            titulo={
              ehMaster && !redeIdSelecionadaMaster
                ? 'Nenhum administrador Master encontrado'
                : 'Nenhum usuário encontrado'
            }
            descricao={
              ehMaster
                ? 'Clique em "Novo usuário" para criar um Administrador Master ou provisionar um usuário para uma rede.'
                : 'Convide a equipe informando papel e unidades de acesso.'
            }
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
            <DialogTitle>
              {emEdicao
                ? emEdicao.isMaster
                  ? 'Editar usuário Master'
                  : 'Editar usuário da rede'
                : formularioEhMasterGlobal
                  ? 'Novo Administrador Master'
                  : 'Novo usuário em rede'}
            </DialogTitle>
            <DialogDescription>
              {formularioEhMasterGlobal
                ? ROLE_DESCRIPTIONS.admin_master
                : ROLE_DESCRIPTIONS[formulario.role as AppRole]}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {ehMaster && !emEdicao ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Vínculo de acesso *</Label>
                <Select
                  value={formulario.escopoRedeId}
                  onValueChange={(valor) =>
                    setFormulario((anterior) => ({
                      ...anterior,
                      escopoRedeId: valor,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ESCOPO_MASTER}>
                      Administrador Master (Acesso Global — sem rede)
                    </SelectItem>
                    {listaRedes.map((rede) => (
                      <SelectItem key={rede.id} value={rede.id}>
                        Rede: {rede.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="usuario-nome">Nome completo *</Label>
              <Input
                id="usuario-nome"
                value={formulario.nome}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    nome: evento.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="usuario-email">E-mail *</Label>
              <Input
                id="usuario-email"
                type="email"
                value={formulario.email}
                disabled={Boolean(emEdicao)}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    email: evento.target.value,
                  }))
                }
                placeholder="nome@clinica.com.br"
              />
              {emEdicao ? (
                <p className="text-xs text-muted-foreground">
                  O e-mail de acesso não pode ser alterado.
                </p>
              ) : null}
            </div>

            {!formularioEhMasterGlobal ? (
              <div className="space-y-1.5">
                <Label>Papel na rede *</Label>
                <Select
                  value={formulario.role}
                  onValueChange={(valor) =>
                    setFormulario((anterior) => ({
                      ...anterior,
                      role: valor as TenantRole,
                    }))
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
            ) : null}

            <div
              className={
                formularioEhMasterGlobal ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'
              }
            >
              <Label htmlFor="usuario-telefone">Telefone</Label>
              <Input
                id="usuario-telefone"
                value={formulario.telefone}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    telefone: evento.target.value,
                  }))
                }
              />
            </div>

            {ehMaster && !emEdicao ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="usuario-senha-inicial"
                  className="flex items-center gap-1.5"
                >
                  <KeyRound className="size-3.5 text-muted-foreground" aria-hidden />
                  Senha inicial (opcional)
                </Label>
                <Input
                  id="usuario-senha-inicial"
                  type="password"
                  value={formulario.senhaInicial}
                  onChange={(evento) =>
                    setFormulario((anterior) => ({
                      ...anterior,
                      senhaInicial: evento.target.value,
                    }))
                  }
                  placeholder="Deixe em branco para enviar convite por e-mail"
                />
                <p className="text-xs text-muted-foreground">
                  Informe ao menos 6 caracteres para ativar o acesso imediatamente, ou
                  deixe em branco para enviar convite por e-mail.
                </p>
              </div>
            ) : null}

            {!ehMaster && formulario.role === 'profissional' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Vínculo com profissional</Label>
                <Select
                  value={formulario.profissionalId}
                  onValueChange={(valor) =>
                    setFormulario((anterior) => ({
                      ...anterior,
                      profissionalId: valor,
                    }))
                  }
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
                  O vínculo permite abrir o prontuário em nome do profissional e assinar
                  documentos.
                </p>
              </div>
            ) : null}

            {!ehMaster ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Unidades de acesso</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(unidades.data ?? []).map((unidade) => (
                    <label
                      key={unidade.id}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm"
                    >
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
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvar.mutate()}
              carregando={salvar.isPending}
              disabled={
                formulario.nome.trim().length < 3 ||
                (!emEdicao && !/^\S+@\S+\.\S+$/.test(formulario.email)) ||
                senhaInicialInvalida
              }
            >
              {emEdicao
                ? 'Salvar alterações'
                : ehMaster && formulario.senhaInicial.trim().length >= 6
                  ? 'Criar usuário ativo'
                  : 'Enviar convite'}
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
