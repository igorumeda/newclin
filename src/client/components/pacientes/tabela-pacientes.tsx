'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, FileUp, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { DataTable } from '@/client/ui/data-table';
import { Input } from '@/client/ui/input';
import { Badge } from '@/client/ui/badge';
import { Card, CardContent } from '@/client/ui/card';
import { EstadoVazio } from '@/client/ui/feedback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/client/ui/overlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { FormularioPaciente } from './formulario-paciente';
import { pacienteService, type PacienteDto } from '@/client/services/paciente.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useDebounce } from '@/client/hooks/use-debounce';
import { usePaginacao } from '@/client/hooks/use-paginacao';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { formatarData, formatarIdade } from '@/client/lib/format';
import { cn } from '@/client/lib/utils';

function baixarJson(nomeArquivo: string, conteudo: unknown) {
  const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function TabelaPacientes() {
  const queryClient = useQueryClient();
  const { unidadeId } = useUnidadeAtiva();
  const { pode } = usePermissoes();

  const [termo, setTermo] = React.useState('');
  const [somenteAtivos, setSomenteAtivos] = React.useState(true);
  const [pacienteEmEdicao, setPacienteEmEdicao] = React.useState<PacienteDto | null>(null);
  const [pacienteParaInativar, setPacienteParaInativar] = React.useState<PacienteDto | null>(null);
  const { page, perPage, irPara, definirPerPage } = usePaginacao(20);

  const termoDebounced = useDebounce(termo, 400);

  React.useEffect(() => {
    irPara(1);
  }, [termoDebounced, somenteAtivos, irPara]);

  const consulta = useQuery({
    queryKey: ['pacientes', { termo: termoDebounced, somenteAtivos, unidadeId, page, perPage }],
    queryFn: () =>
      pacienteService.listar({
        termo: termoDebounced || undefined,
        somenteAtivos,
        unidadeId: unidadeId ?? undefined,
        page,
        perPage,
      }),
    placeholderData: (anterior) => anterior,
  });

  const inativar = useMutation({
    mutationFn: (paciente: PacienteDto) =>
      paciente.ativo ? pacienteService.inativar(paciente.id) : pacienteService.reativar(paciente.id),
    onSuccess: (paciente) => {
      toast.success(paciente.ativo ? 'Paciente reativado' : 'Paciente inativado');
      setPacienteParaInativar(null);
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const exportar = useMutation({
    mutationFn: (paciente: PacienteDto) => pacienteService.exportarDados(paciente.id),
    onSuccess: (dados, paciente) => {
      baixarJson(`dados-paciente-${paciente.cpf}.json`, dados);
      toast.success('Exportação gerada (LGPD)');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const colunas = React.useMemo<ColumnDef<PacienteDto, unknown>[]>(
    () => [
      {
        id: 'nome',
        header: 'Paciente',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/pacientes/${row.original.id}`}
                className="truncate font-medium hover:text-primary hover:underline"
              >
                {row.original.nome}
              </Link>
              {row.original.menorDeIdade ? (
                <Badge variant="warning" title="Menor de idade — responsável obrigatório">
                  menor
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {formatarIdade(row.original.idade)} · {row.original.sexoLabel}
              {row.original.alergias ? ' · alergias' : ''}
            </p>
          </div>
        ),
      },
      {
        id: 'cpf',
        header: 'CPF',
        cell: ({ row }) => <span className="tabular-nums">{row.original.cpfFormatado}</span>,
      },
      {
        id: 'nascimento',
        header: 'Nascimento',
        cell: ({ row }) => <span className="tabular-nums">{formatarData(row.original.dataNascimento)}</span>,
      },
      {
        id: 'contato',
        header: 'Contato',
        cell: ({ row }) => (
          <div className="min-w-0 text-sm">
            <p className="truncate">{row.original.telefone ?? '—'}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email ?? ''}</p>
          </div>
        ),
      },
      {
        id: 'responsavel',
        header: 'Responsável',
        cell: ({ row }) =>
          row.original.responsavel.nome ? (
            <div className="min-w-0 text-sm">
              <p className="truncate">{row.original.responsavel.nome}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.responsavel.parentesco ?? ''} {row.original.responsavel.telefone ?? ''}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
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
                <DropdownMenuItem asChild>
                  <Link href={`/pacientes/${row.original.id}`}>
                    <UserRound aria-hidden />
                    Abrir ficha
                  </Link>
                </DropdownMenuItem>
                {pode('pacientes:editar') ? (
                  <DropdownMenuItem onClick={() => setPacienteEmEdicao(row.original)}>
                    <Pencil aria-hidden />
                    Editar
                  </DropdownMenuItem>
                ) : null}
                {pode('pacientes:exportar') ? (
                  <DropdownMenuItem onClick={() => exportar.mutate(row.original)}>
                    <Download aria-hidden />
                    Exportar dados (LGPD)
                  </DropdownMenuItem>
                ) : null}
                {pode('pacientes:inativar') ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variante="destructive"
                      onClick={() => setPacienteParaInativar(row.original)}
                    >
                      {row.original.ativo ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
                      {row.original.ativo ? 'Inativar paciente' : 'Reativar paciente'}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [exportar, pode],
  );

  const total = (consulta.data?.meta.total as number | undefined) ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={termo}
              onChange={(evento) => setTermo(evento.target.value)}
              placeholder="Buscar por nome (parcial) ou CPF exato"
              className="pl-9"
              aria-label="Buscar pacientes"
            />
          </div>

          <Select
            value={somenteAtivos ? 'ativos' : 'todos'}
            onValueChange={(valor) => setSomenteAtivos(valor === 'ativos')}
          >
            <SelectTrigger className="sm:w-44" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativos">Somente ativos</SelectItem>
              <SelectItem value="todos">Incluir inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(perPage)} onValueChange={(valor) => definirPerPage(Number(valor))}>
            <SelectTrigger className="sm:w-32" aria-label="Itens por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 / pág.</SelectItem>
              <SelectItem value="50">50 / pág.</SelectItem>
              <SelectItem value="100">100 / pág.</SelectItem>
            </SelectContent>
          </Select>

          {pode('pacientes:importar') ? (
            <Button variant="outline" asChild>
              <Link href="/pacientes/importar">
                <FileUp aria-hidden />
                Importar
              </Link>
            </Button>
          ) : null}

          {pode('pacientes:criar') ? (
            <Button asChild>
              <Link href="/pacientes/novo">
                <Plus aria-hidden />
                Novo paciente
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <DataTable
        colunas={colunas}
        dados={consulta.data?.items ?? []}
        carregando={consulta.isLoading}
        paginacaoServidor={{ page, perPage, total, aoMudarPagina: irPara }}
        estadoVazio={
          <EstadoVazio
            titulo={termo ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            descricao={
              termo
                ? 'Revise a busca: a pesquisa por nome aceita parte do nome; para CPF é necessário o número exato.'
                : 'Cadastre o primeiro paciente ou importe a planilha da clínica.'
            }
            icone={UserRound}
          />
        }
      />

      <Dialog
        open={Boolean(pacienteEmEdicao)}
        onOpenChange={(aberto) => {
          if (!aberto) setPacienteEmEdicao(null);
        }}
      >
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>Editar paciente</DialogTitle>
            <DialogDescription>
              Alterações ficam registradas na auditoria com os valores anteriores e posteriores.
            </DialogDescription>
          </DialogHeader>
          {pacienteEmEdicao ? (
            <FormularioPaciente
              paciente={pacienteEmEdicao}
              textoBotao="Salvar alterações"
              aoCancelar={() => setPacienteEmEdicao(null)}
              aoSalvar={() => setPacienteEmEdicao(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(pacienteParaInativar)}
        aoMudar={(aberto) => {
          if (!aberto) setPacienteParaInativar(null);
        }}
        titulo={pacienteParaInativar?.ativo ? 'Inativar paciente' : 'Reativar paciente'}
        descricao={
          pacienteParaInativar?.ativo
            ? `O histórico de ${pacienteParaInativar?.nome} é preservado (exclusão lógica): o cadastro sai das listas e da agenda, mas continua recuperável.`
            : `O cadastro de ${pacienteParaInativar?.nome} voltará a aparecer nas buscas e poderá ser agendado.`
        }
        textoConfirmar={pacienteParaInativar?.ativo ? 'Inativar' : 'Reativar'}
        carregando={inativar.isPending}
        onConfirmar={() => pacienteParaInativar && inativar.mutate(pacienteParaInativar)}
      />

      <p className={cn('text-xs text-muted-foreground', consulta.isFetching && 'opacity-60')}>
        {consulta.isFetching ? 'Atualizando lista…' : `${total} paciente(s) encontrados`}
      </p>
    </div>
  );
}
