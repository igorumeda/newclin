'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  Building2,
  Globe,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard } from '@/client/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import { Label, Switch } from '@/client/ui/controls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/ui/select';
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
import { DataTable } from '@/client/ui/data-table';
import { EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import {
  masterService,
  type ResumoMasterRedeItemDto,
} from '@/client/services/master.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { formatarData, formatarDataHora, formatarNumero } from '@/client/lib/format';
import { Rede } from '@/modules/organization/domain/entities/rede.entity';
import { TEMA_PRESETS } from '@/modules/organization/domain/value-objects/tema.vo';

type FiltrarRedesMasterParams = {
  redes: ResumoMasterRedeItemDto[];
  busca: string;
  situacao: 'todas' | 'ativas' | 'inativas';
};

type FormularioRedeMaster = {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  slug: string;
  email: string;
  telefone: string;
  presetTema: string;
  ativo: boolean;
};

const FORMULARIO_VAZIO: FormularioRedeMaster = {
  nome: '',
  razaoSocial: '',
  cnpj: '',
  slug: '',
  email: '',
  telefone: '',
  presetTema: TEMA_PRESETS[0].id,
  ativo: true,
};

function formatarCnpj({ cnpj }: { cnpj: string | null }): string {
  if (!cnpj) return '—';
  const digitos = cnpj.replace(/\D/g, '');
  if (digitos.length !== 14) return cnpj;
  return digitos.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

function aplicarMascaraCnpj({ valor }: { valor: string }): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12, 14)}`;
}

function filtrarRedesMaster({
  redes,
  busca,
  situacao,
}: FiltrarRedesMasterParams): ResumoMasterRedeItemDto[] {
  const termo = busca.trim().toLowerCase();
  return redes.filter((rede) => {
    if (situacao === 'ativas' && !rede.ativo) return false;
    if (situacao === 'inativas' && rede.ativo) return false;
    if (!termo) return true;

    const alvo = [
      rede.nome,
      rede.razaoSocial ?? '',
      rede.cnpj ?? '',
      rede.slug ?? '',
      rede.email ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return alvo.includes(termo);
  });
}

export function PainelMaster() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = React.useState('');
  const [situacao, setSituacao] = React.useState<'todas' | 'ativas' | 'inativas'>(
    'todas',
  );
  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [redeEmEdicao, setRedeEmEdicao] =
    React.useState<ResumoMasterRedeItemDto | null>(null);
  const [slugEditadoManualmente, setSlugEditadoManualmente] = React.useState(false);
  const [formulario, setFormulario] =
    React.useState<FormularioRedeMaster>(FORMULARIO_VAZIO);
  const [redeAlterandoSituacao, setRedeAlterandoSituacao] =
    React.useState<ResumoMasterRedeItemDto | null>(null);

  const consulta = useQuery({
    queryKey: ['master', 'redes', 'resumo'],
    queryFn: () => masterService.obterResumoRedes(),
    refetchInterval: 60 * 1000,
  });

  const salvarRede = useMutation({
    mutationFn: async () => {
      const validacao = Rede.create({
        nome: formulario.nome,
        razaoSocial: formulario.razaoSocial || null,
        cnpj: formulario.cnpj || null,
        slug: formulario.slug || null,
        email: formulario.email || null,
        telefone: formulario.telefone || null,
        presetTema: redeEmEdicao ? undefined : formulario.presetTema,
        ativo: formulario.ativo,
      });

      if (validacao.isFailure) {
        throw validacao.error;
      }

      const dadosValidados = validacao.value;

      if (redeEmEdicao) {
        return masterService.atualizarRede({
          redeId: redeEmEdicao.id,
          dados: {
            nome: dadosValidados.nome,
            razaoSocial: dadosValidados.razaoSocial,
            cnpj: dadosValidados.cnpj,
            slug: dadosValidados.slug,
            email: dadosValidados.email,
            telefone: dadosValidados.telefone,
            ativo: dadosValidados.ativo,
          },
        });
      }

      return masterService.criarRede({
        nome: dadosValidados.nome,
        razaoSocial: dadosValidados.razaoSocial,
        cnpj: dadosValidados.cnpj,
        slug: dadosValidados.slug,
        email: dadosValidados.email,
        telefone: dadosValidados.telefone,
        presetTema: formulario.presetTema,
        ativo: dadosValidados.ativo,
      });
    },
    onSuccess: () => {
      toast.success(
        redeEmEdicao
          ? 'Dados da rede atualizados com sucesso'
          : 'Nova rede cadastrada na plataforma',
      );
      setDialogoAberto(false);
      setRedeEmEdicao(null);
      void queryClient.invalidateQueries({ queryKey: ['master', 'redes', 'resumo'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacaoRede = useMutation({
    mutationFn: (rede: ResumoMasterRedeItemDto) =>
      masterService.atualizarRede({
        redeId: rede.id,
        dados: { ativo: !rede.ativo },
      }),
    onSuccess: (rede) => {
      toast.success(rede.ativo ? 'Rede reativada' : 'Rede inativada');
      setRedeAlterandoSituacao(null);
      void queryClient.invalidateQueries({ queryKey: ['master', 'redes', 'resumo'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirNovaRede() {
    setRedeEmEdicao(null);
    setSlugEditadoManualmente(false);
    setFormulario(FORMULARIO_VAZIO);
    setDialogoAberto(true);
  }

  function abrirEdicaoRede(rede: ResumoMasterRedeItemDto) {
    setRedeEmEdicao(rede);
    setSlugEditadoManualmente(true);
    setFormulario({
      nome: rede.nome,
      razaoSocial: rede.razaoSocial ?? '',
      cnpj: rede.cnpj ? aplicarMascaraCnpj({ valor: rede.cnpj }) : '',
      slug: rede.slug ?? '',
      email: rede.email ?? '',
      telefone: rede.telefone ?? '',
      presetTema: TEMA_PRESETS[0].id,
      ativo: rede.ativo,
    });
    setDialogoAberto(true);
  }

  const colunasRedes = React.useMemo<ColumnDef<ResumoMasterRedeItemDto, unknown>[]>(
    () => [
      {
        id: 'rede',
        header: 'Rede / Organização',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex min-w-0 items-center gap-3">
              {item.logotipoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.logotipoUrl}
                  alt={item.nome}
                  className="size-9 shrink-0 rounded-md border object-contain p-0.5"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="size-4" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-foreground">{item.nome}</p>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {item.razaoSocial ?? 'Razão social não informada'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'documento',
        header: 'CNPJ / Contato',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium tabular-nums">
              {formatarCnpj({ cnpj: row.original.cnpj })}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email ?? row.original.telefone ?? '—'}
            </p>
          </div>
        ),
      },
      {
        id: 'unidades',
        header: 'Unidades',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatarNumero(row.original.unidadesAtivas)}
          </span>
        ),
      },
      {
        id: 'equipe',
        header: 'Equipe ativa',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {formatarNumero(row.original.usuariosAtivos)} usuários
            </p>
            <p className="text-muted-foreground">
              {formatarNumero(row.original.profissionaisAtivos)} profissionais
            </p>
          </div>
        ),
      },
      {
        id: 'pacientes',
        header: 'Pacientes',
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatarNumero(row.original.pacientesAtivos)}
          </span>
        ),
      },
      {
        id: 'movimento',
        header: 'Atendimentos',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {formatarNumero(row.original.atendimentos30d)} em 30 dias
            </p>
            <p className="text-muted-foreground">
              {formatarNumero(row.original.consultasHoje)} agendadas hoje
            </p>
          </div>
        ),
      },
      {
        id: 'cadastro',
        header: 'Criada em',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatarData(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.ativo ? 'success' : 'secondary'}>
            {row.original.ativo ? 'Ativa' : 'Inativa'}
          </Badge>
        ),
      },
      {
        id: 'acoes',
        header: '',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Ações da rede ${item.nome}`}
                  >
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Gerenciar rede</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => abrirEdicaoRede(item)}>
                    <Pencil aria-hidden />
                    Editar dados
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variante={item.ativo ? 'destructive' : undefined}
                    onClick={() => setRedeAlterandoSituacao(item)}
                  >
                    {item.ativo ? (
                      <Trash2 aria-hidden />
                    ) : (
                      <RotateCcw aria-hidden />
                    )}
                    {item.ativo ? 'Inativar rede' : 'Reativar rede'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  const indicadores = consulta.data?.indicadores;
  const redesFiltradas = React.useMemo(
    () =>
      filtrarRedesMaster({
        redes: consulta.data?.redes ?? [],
        busca,
        situacao,
      }),
    [consulta.data?.redes, busca, situacao],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Administração Master — Visão Geral"
        descricao="Panorama consolidado de todas as redes, clínicas, profissionais e pacientes da plataforma."
        acoes={
          <>
            <Button
              variant="outline"
              onClick={() => void consulta.refetch()}
              disabled={consulta.isFetching}
            >
              <RefreshCw
                className={consulta.isFetching ? 'animate-spin' : undefined}
                aria-hidden
              />
              Atualizar
            </Button>
            <Button onClick={abrirNovaRede}>
              <Plus aria-hidden />
              Nova rede
            </Button>
          </>
        }
      />

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={2} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            titulo="Redes ativas"
            valor={formatarNumero(indicadores?.redesAtivas)}
            icone={Globe}
            descricao={`de ${formatarNumero(indicadores?.totalRedes)} redes cadastradas`}
          />
          <StatCard
            titulo="Unidades ativas"
            valor={formatarNumero(indicadores?.totalUnidades)}
            icone={Building2}
            descricao="em todas as redes"
          />
          <StatCard
            titulo="Usuários de redes"
            valor={formatarNumero(indicadores?.totalUsuariosRede)}
            icone={Users}
            descricao={`${formatarNumero(indicadores?.totalUsuariosMaster)} administradores master`}
          />
          <StatCard
            titulo="Profissionais ativos"
            valor={formatarNumero(indicadores?.totalProfissionais)}
            icone={Stethoscope}
            descricao="corpo clínico total"
          />
          <StatCard
            titulo="Pacientes ativos"
            valor={formatarNumero(indicadores?.totalPacientes)}
            icone={UserCheck}
            descricao="cadastros ativos"
          />
          <StatCard
            titulo="Atendimentos (30d)"
            valor={formatarNumero(indicadores?.atendimentos30d)}
            icone={Activity}
            descricao={`${formatarNumero(indicadores?.consultasHoje)} consultas hoje`}
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Redes cadastradas na plataforma</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {indicadores?.geradoEm
                ? `Estatísticas atualizadas em ${formatarDataHora(indicadores.geradoEm)}.`
                : 'Resumo individual de estrutura, equipe e volume de atendimento por rede.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar rede, CNPJ ou slug..."
              className="sm:w-64"
              aria-label="Buscar redes"
            />
            <Select
              value={situacao}
              onValueChange={(valor) =>
                setSituacao(valor as 'todas' | 'ativas' | 'inativas')
              }
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as situações</SelectItem>
                <SelectItem value="ativas">Apenas ativas</SelectItem>
                <SelectItem value="inativas">Apenas inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            colunas={colunasRedes}
            dados={redesFiltradas}
            carregando={consulta.isLoading}
            estadoVazio={
              <EstadoVazio
                titulo="Nenhuma rede encontrada"
                descricao="Cadastre uma nova rede ou ajuste os filtros de busca."
                icone={Building2}
                acao={
                  <Button onClick={abrirNovaRede}>
                    <Plus aria-hidden />
                    Cadastrar primeira rede
                  </Button>
                }
              />
            }
          />
        </CardContent>
      </Card>

      <Dialog
        open={dialogoAberto}
        onOpenChange={(aberto) => {
          setDialogoAberto(aberto);
          if (!aberto) setRedeEmEdicao(null);
        }}
      >
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>
              {redeEmEdicao ? 'Editar rede' : 'Nova rede (Tenant)'}
            </DialogTitle>
            <DialogDescription>
              {redeEmEdicao
                ? 'Atualize os dados cadastrais, identificador e situação operacional desta rede.'
                : 'Ao criar uma nova rede, os tipos de atendimento, templates clínicos e modelos de notificação padrão são provisionados automaticamente.'}
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              salvarRede.mutate();
            }}
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rede-master-nome">Nome fantasia da rede *</Label>
              <Input
                id="rede-master-nome"
                value={formulario.nome}
                onChange={(evento) => {
                  const novoNome = evento.target.value;
                  setFormulario((anterior) => ({
                    ...anterior,
                    nome: novoNome,
                    slug: slugEditadoManualmente
                      ? anterior.slug
                      : Rede.normalizarSlug({ valor: novoNome }),
                  }));
                }}
                placeholder="Ex.: Rede Clínica Vida"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rede-master-razao">Razão social</Label>
              <Input
                id="rede-master-razao"
                value={formulario.razaoSocial}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    razaoSocial: evento.target.value,
                  }))
                }
                placeholder="Ex.: Clínica Vida Assistência Médica Ltda."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rede-master-cnpj">CNPJ</Label>
              <Input
                id="rede-master-cnpj"
                value={formulario.cnpj}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    cnpj: aplicarMascaraCnpj({ valor: evento.target.value }),
                  }))
                }
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rede-master-slug">Identificador (Slug)</Label>
              <Input
                id="rede-master-slug"
                value={formulario.slug}
                onChange={(evento) => {
                  setSlugEditadoManualmente(true);
                  setFormulario((anterior) => ({
                    ...anterior,
                    slug: Rede.normalizarSlug({ valor: evento.target.value }),
                  }));
                }}
                placeholder="rede-clinica-vida"
              />
              <p className="text-[11px] text-muted-foreground">
                Identificador único em letras minúsculas e hífens.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rede-master-telefone">Telefone institucional</Label>
              <Input
                id="rede-master-telefone"
                value={formulario.telefone}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    telefone: evento.target.value,
                  }))
                }
                placeholder="(11) 3333-4444"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rede-master-email">E-mail institucional</Label>
              <Input
                id="rede-master-email"
                type="email"
                value={formulario.email}
                onChange={(evento) =>
                  setFormulario((anterior) => ({
                    ...anterior,
                    email: evento.target.value,
                  }))
                }
                placeholder="contato@suarede.com.br"
              />
            </div>

            {!redeEmEdicao ? (
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-1.5">
                  <Palette className="size-3.5 text-muted-foreground" aria-hidden />
                  Tema visual inicial da rede
                </Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TEMA_PRESETS.map((presetItem) => {
                    const selecionado = formulario.presetTema === presetItem.id;
                    return (
                      <button
                        key={presetItem.id}
                        type="button"
                        aria-pressed={selecionado}
                        onClick={() =>
                          setFormulario((anterior) => ({
                            ...anterior,
                            presetTema: presetItem.id,
                          }))
                        }
                        className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selecionado
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <span className="flex shrink-0 gap-1">
                          {[
                            presetItem.light.primary,
                            presetItem.light.accent,
                            presetItem.light.sidebar,
                          ].map((cor, indice) => (
                            <span
                              key={indice}
                              aria-hidden
                              className="size-4 rounded-full border"
                              style={{ backgroundColor: `hsl(${cor})` }}
                            />
                          ))}
                        </span>
                        <span className="min-w-0 truncate text-xs font-medium">
                          {presetItem.nome}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 sm:col-span-2">
              <div className="space-y-0.5">
                <Label htmlFor="rede-master-ativo" className="cursor-pointer">
                  Rede ativa para operação
                </Label>
                <p className="text-xs text-muted-foreground">
                  Redes inativas ficam bloqueadas para novos acessos e agendamentos.
                </p>
              </div>
              <Switch
                id="rede-master-ativo"
                checked={formulario.ativo}
                onCheckedChange={(checked) =>
                  setFormulario((anterior) => ({ ...anterior, ativo: checked }))
                }
              />
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogoAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                carregando={salvarRede.isPending}
                disabled={formulario.nome.trim().length < 3}
              >
                {redeEmEdicao ? 'Salvar alterações' : 'Criar rede'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(redeAlterandoSituacao)}
        aoMudar={(aberto) => {
          if (!aberto) setRedeAlterandoSituacao(null);
        }}
        titulo={
          redeAlterandoSituacao?.ativo ? 'Inativar rede' : 'Reativar rede'
        }
        descricao={
          redeAlterandoSituacao?.ativo
            ? `Tem certeza que deseja inativar a rede "${redeAlterandoSituacao.nome}"? Os dados clínicos e cadastrais são preservados, mas o acesso operacional da rede ficará suspenso.`
            : `Deseja reativar a rede "${redeAlterandoSituacao?.nome ?? ''}" para liberar novamente o acesso às unidades e usuários?`
        }
        textoConfirmar={
          redeAlterandoSituacao?.ativo ? 'Inativar rede' : 'Reativar rede'
        }
        carregando={alterarSituacaoRede.isPending}
        onConfirmar={() => {
          if (redeAlterandoSituacao) {
            alterarSituacaoRede.mutate(redeAlterandoSituacao);
          }
        }}
      />
    </div>
  );
}
