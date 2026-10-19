'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, Clock, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, UserSquare2 } from 'lucide-react';
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
import { EstadoVazio } from '@/client/ui/feedback';
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
import { profissionalService, type HorarioPayload, type ProfissionalDto } from '@/client/services/profissional.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useDebounce } from '@/client/hooks/use-debounce';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { CONSELHOS_CLASSE } from '@/modules/professional/domain/value-objects/registro-conselho.vo';
import { formatarDataHora } from '@/client/lib/format';
import { maskCpf, maskPhone } from '@/client/lib/utils';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type FormularioProfissional = {
  nome: string;
  conselhoClasse: string;
  numeroConselho: string;
  ufConselho: string;
  cpf: string;
  especialidade: string;
  registroEspecialista: string;
  telefone: string;
  email: string;
  corAgenda: string;
  observacoes: string;
};

const FORMULARIO_VAZIO: FormularioProfissional = {
  nome: '',
  conselhoClasse: 'CRM',
  numeroConselho: '',
  ufConselho: '',
  cpf: '',
  especialidade: '',
  registroEspecialista: '',
  telefone: '',
  email: '',
  corAgenda: '#0ea5e9',
  observacoes: '',
};

export default function ProfissionaisPage() {
  const queryClient = useQueryClient();
  const { unidadeId } = useUnidadeAtiva();

  const [busca, setBusca] = React.useState('');
  const [somenteAtivos, setSomenteAtivos] = React.useState(true);
  const [emEdicao, setEmEdicao] = React.useState<ProfissionalDto | null>(null);
  const [formulario, setFormulario] = React.useState<FormularioProfissional>(FORMULARIO_VAZIO);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = React.useState<string[]>([]);
  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [horariosDe, setHorariosDe] = React.useState<ProfissionalDto | null>(null);
  const [horarios, setHorarios] = React.useState<HorarioPayload[]>([]);
  const [inativando, setInativando] = React.useState<ProfissionalDto | null>(null);

  const buscaDebounced = useDebounce(busca, 400);

  const consulta = useQuery({
    queryKey: ['profissionais', { buscaDebounced, somenteAtivos, unidadeId }],
    queryFn: () =>
      profissionalService.listar({
        busca: buscaDebounced || undefined,
        unidadeId: unidadeId ?? undefined,
        ativo: somenteAtivos,
        incluirHorarios: true,
      }),
  });

  const unidades = useQuery({
    queryKey: ['organizacao', 'unidades', { ativo: true }],
    queryFn: () => import('@/client/services/organizacao.service').then((m) => m.organizacaoService.listarUnidades({ ativo: true })),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: formulario.nome,
        conselhoClasse: formulario.conselhoClasse,
        numeroConselho: formulario.numeroConselho,
        ufConselho: formulario.ufConselho || null,
        cpf: formulario.cpf || null,
        especialidade: formulario.especialidade || null,
        registroEspecialista: formulario.registroEspecialista || null,
        telefone: formulario.telefone || null,
        email: formulario.email || null,
        corAgenda: formulario.corAgenda,
        observacoes: formulario.observacoes || null,
      };

      const profissional = emEdicao
        ? await profissionalService.atualizar(emEdicao.id, payload)
        : await profissionalService.criar({ ...payload, unidades: unidadesSelecionadas });

      if (emEdicao) {
        await profissionalService.definirUnidades(profissional.id, unidadesSelecionadas);
      }

      return profissional;
    },
    onSuccess: () => {
      toast.success(emEdicao ? 'Profissional atualizado' : 'Profissional cadastrado');
      setDialogoAberto(false);
      setEmEdicao(null);
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacao = useMutation({
    mutationFn: (profissional: ProfissionalDto) =>
      profissional.ativo ? profissionalService.inativar(profissional.id) : profissionalService.reativar(profissional.id),
    onSuccess: (profissional) => {
      toast.success(profissional.ativo ? 'Profissional reativado' : 'Profissional inativado');
      setInativando(null);
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const salvarHorarios = useMutation({
    mutationFn: () =>
      profissionalService.definirHorarios(horariosDe?.id as string, unidadeId as string, horarios),
    onSuccess: () => {
      toast.success('Grade de horários atualizada');
      setHorariosDe(null);
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirNovo() {
    setEmEdicao(null);
    setFormulario(FORMULARIO_VAZIO);
    setUnidadesSelecionadas(unidadeId ? [unidadeId] : []);
    setDialogoAberto(true);
  }

  function abrirEdicao(profissional: ProfissionalDto) {
    setEmEdicao(profissional);
    setFormulario({
      nome: profissional.nome,
      conselhoClasse: profissional.conselhoClasse,
      numeroConselho: profissional.numeroConselho,
      ufConselho: profissional.ufConselho ?? '',
      cpf: profissional.cpf ?? '',
      especialidade: profissional.especialidade ?? '',
      registroEspecialista: profissional.registroEspecialista ?? '',
      telefone: profissional.telefone ?? '',
      email: profissional.email ?? '',
      corAgenda: profissional.corAgenda,
      observacoes: profissional.observacoes ?? '',
    });
    setUnidadesSelecionadas(profissional.unidades);
    setDialogoAberto(true);
  }

  function abrirHorarios(profissional: ProfissionalDto) {
    setHorariosDe(profissional);
    setHorarios(
      profissional.horarios
        .filter((horario) => !unidadeId || horario.unidadeId === unidadeId)
        .map((horario) => ({
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          horaFim: horario.horaFim,
          duracaoSlotMinutos: horario.duracaoSlotMinutos,
          intervaloMinutos: horario.intervaloMinutos,
        })),
    );
  }

  const colunas = React.useMemo<ColumnDef<ProfissionalDto, unknown>[]>(
    () => [
      {
        id: 'nome',
        header: 'Profissional',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-3 shrink-0 rounded-full"
              style={{ backgroundColor: row.original.corAgenda }}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.especialidade ?? 'Clínica geral'}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'registro',
        header: 'Registro',
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {row.original.registroFormatado}
            {row.original.registroEspecialista ? (
              <span className="block text-xs text-muted-foreground">
                esp. {row.original.registroEspecialista}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: 'contato',
        header: 'Contato',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{row.original.telefone ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{row.original.email ?? ''}</p>
          </div>
        ),
      },
      {
        id: 'unidades',
        header: 'Unidades',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.unidades.length === 0 ? (
              <span className="text-xs text-muted-foreground">nenhuma</span>
            ) : (
              row.original.unidades.slice(0, 2).map((unidade) => (
                <Badge key={unidade} variant="secondary">
                  {unidades.data?.find((item) => item.id === unidade)?.nome ?? 'unidade'}
                </Badge>
              ))
            )}
            {row.original.unidades.length > 2 ? (
              <Badge variant="outline">+{row.original.unidades.length - 2}</Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'agenda',
        header: 'Grade',
        cell: ({ row }) =>
          row.original.horarios.length === 0 ? (
            <span className="text-xs text-warning">sem horários</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {row.original.horarios.length} período(s) ·{' '}
              {row.original.horarios[0].duracaoSlotMinutos} min/slot
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
                  Editar cadastro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => abrirHorarios(row.original)}>
                  <Clock aria-hidden />
                  Grade de horários
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variante="destructive" onClick={() => setInativando(row.original)}>
                  {row.original.ativo ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
                  {row.original.ativo ? 'Inativar' : 'Reativar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unidades.data],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Profissionais"
        descricao="Cadastro de médicos e demais profissionais de saúde, com registro de conselho, unidades de atendimento e grade de horários."
        acoes={
          <Button onClick={abrirNovo}>
            <Plus aria-hidden />
            Novo profissional
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, especialidade ou registro"
              className="pl-9"
              aria-label="Buscar profissionais"
            />
          </div>
          <Select value={somenteAtivos ? 'ativos' : 'todos'} onValueChange={(valor) => setSomenteAtivos(valor === 'ativos')}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativos">Somente ativos</SelectItem>
              <SelectItem value="todos">Incluir inativos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <DataTable
        colunas={colunas}
        dados={consulta.data?.items ?? []}
        carregando={consulta.isLoading}
        estadoVazio={
          <EstadoVazio
            titulo="Nenhum profissional cadastrado"
            descricao="Cadastre os profissionais para liberar a agenda e o prontuário."
            icone={UserSquare2}
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
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar profissional' : 'Novo profissional'}</DialogTitle>
            <DialogDescription>
              O registro de conselho aparece na assinatura dos documentos clínicos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="profissional-nome">Nome completo *</Label>
              <Input
                id="profissional-nome"
                value={formulario.nome}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nome: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-conselho">Conselho *</Label>
              <Select
                value={formulario.conselhoClasse}
                onValueChange={(valor) => setFormulario((anterior) => ({ ...anterior, conselhoClasse: valor }))}
              >
                <SelectTrigger id="profissional-conselho">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSELHOS_CLASSE.map((conselho) => (
                    <SelectItem key={conselho} value={conselho}>
                      {conselho}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="profissional-numero">Número *</Label>
                <Input
                  id="profissional-numero"
                  value={formulario.numeroConselho}
                  onChange={(evento) =>
                    setFormulario((anterior) => ({ ...anterior, numeroConselho: evento.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profissional-uf">UF</Label>
                <Input
                  id="profissional-uf"
                  maxLength={2}
                  className="uppercase"
                  value={formulario.ufConselho}
                  onChange={(evento) =>
                    setFormulario((anterior) => ({ ...anterior, ufConselho: evento.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-especialidade">Especialidade</Label>
              <Input
                id="profissional-especialidade"
                value={formulario.especialidade}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, especialidade: evento.target.value }))}
                placeholder="Ex.: Pediatria"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-registro-esp">Registro de especialista</Label>
              <Input
                id="profissional-registro-esp"
                value={formulario.registroEspecialista}
                onChange={(evento) =>
                  setFormulario((anterior) => ({ ...anterior, registroEspecialista: evento.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-cpf">CPF</Label>
              <Input
                id="profissional-cpf"
                inputMode="numeric"
                value={formulario.cpf}
                onChange={(evento) =>
                  setFormulario((anterior) => ({ ...anterior, cpf: maskCpf(evento.target.value) }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-telefone">Telefone</Label>
              <Input
                id="profissional-telefone"
                inputMode="tel"
                value={formulario.telefone}
                onChange={(evento) =>
                  setFormulario((anterior) => ({ ...anterior, telefone: maskPhone(evento.target.value) }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-email">E-mail</Label>
              <Input
                id="profissional-email"
                type="email"
                value={formulario.email}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, email: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profissional-cor">Cor na agenda</Label>
              <Input
                id="profissional-cor"
                type="color"
                className="h-11 w-20 p-1"
                value={formulario.corAgenda}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, corAgenda: evento.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Unidades de atendimento</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(unidades.data ?? []).map((unidade) => (
                  <label key={unidade.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <Checkbox
                      checked={unidadesSelecionadas.includes(unidade.id)}
                      onCheckedChange={(marcado) =>
                        setUnidadesSelecionadas((anterior) =>
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
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="profissional-observacoes">Observações</Label>
              <Input
                id="profissional-observacoes"
                value={formulario.observacoes}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, observacoes: evento.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvar.mutate()}
              carregando={salvar.isPending}
              disabled={formulario.nome.trim().length < 3 || formulario.numeroConselho.trim().length < 3}
            >
              {emEdicao ? 'Salvar alterações' : 'Cadastrar profissional'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(horariosDe)} onOpenChange={(aberto) => !aberto && setHorariosDe(null)}>
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>Grade de horários — {horariosDe?.nome}</DialogTitle>
            <DialogDescription>
              Sem horários cadastrados o profissional não aparece nos horários disponíveis da agenda. Cada
              período vale para a unidade selecionada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {DIAS.map((dia, indice) => {
              const periodos = horarios.filter((horario) => horario.diaSemana === indice);

              return (
                <div key={dia} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{dia}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setHorarios((anterior) => [
                          ...anterior,
                          { diaSemana: indice, horaInicio: '08:00', horaFim: '12:00', duracaoSlotMinutos: 30 },
                        ])
                      }
                    >
                      <Plus aria-hidden />
                      Adicionar período
                    </Button>
                  </div>

                  {periodos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem atendimento neste dia.</p>
                  ) : (
                    periodos.map((periodo, posicao) => {
                      const indiceGlobal = horarios.findIndex((item) => item === periodo);
                      return (
                        <div key={`${indice}-${posicao}`} className="flex flex-wrap items-end gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Início</Label>
                            <Input
                              type="time"
                              className="w-28"
                              value={periodo.horaInicio}
                              onChange={(evento) =>
                                setHorarios((anterior) =>
                                  anterior.map((item, posicaoItem) =>
                                    posicaoItem === indiceGlobal ? { ...item, horaInicio: evento.target.value } : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Fim</Label>
                            <Input
                              type="time"
                              className="w-28"
                              value={periodo.horaFim}
                              onChange={(evento) =>
                                setHorarios((anterior) =>
                                  anterior.map((item, posicaoItem) =>
                                    posicaoItem === indiceGlobal ? { ...item, horaFim: evento.target.value } : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Slot (min)</Label>
                            <Input
                              type="number"
                              min={5}
                              max={480}
                              className="w-24"
                              value={periodo.duracaoSlotMinutos ?? 30}
                              onChange={(evento) =>
                                setHorarios((anterior) =>
                                  anterior.map((item, posicaoItem) =>
                                    posicaoItem === indiceGlobal
                                      ? { ...item, duracaoSlotMinutos: Number(evento.target.value) }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remover período"
                            onClick={() =>
                              setHorarios((anterior) =>
                                anterior.filter((_, posicaoItem) => posicaoItem !== indiceGlobal),
                              )
                            }
                          >
                            <Trash2 className="text-destructive" aria-hidden />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHorariosDe(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvarHorarios.mutate()}
              carregando={salvarHorarios.isPending}
              disabled={!unidadeId}
            >
              <Check aria-hidden />
              Salvar grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(inativando)}
        aoMudar={(aberto) => !aberto && setInativando(null)}
        titulo={inativando?.ativo ? 'Inativar profissional' : 'Reativar profissional'}
        descricao={
          inativando?.ativo
            ? `${inativando?.nome} deixa de aparecer na agenda e nos novos agendamentos. Agendamentos existentes não são alterados.`
            : `${inativando?.nome} volta a aparecer na agenda e nos horários disponíveis.`
        }
        textoConfirmar={inativando?.ativo ? 'Inativar' : 'Reativar'}
        carregando={alterarSituacao.isPending}
        onConfirmar={() => inativando && alterarSituacao.mutate(inativando)}
      />

      <p className="text-xs text-muted-foreground">
        Última atualização:{' '}
        {consulta.dataUpdatedAt ? formatarDataHora(new Date(consulta.dataUpdatedAt)) : '—'}
      </p>
    </div>
  );
}
