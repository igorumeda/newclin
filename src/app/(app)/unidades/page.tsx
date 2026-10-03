'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2, Clock, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
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
import { organizacaoService } from '@/client/services/organizacao.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import type { UnidadeDto } from '@/modules/organization/application/dtos/organizacao.dto';

const FUSOS = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Rio_Branco',
  'America/Noronha',
];

type FormularioUnidade = {
  nome: string;
  cnes: string;
  cnpj: string;
  telefone: string;
  email: string;
  timezone: string;
  observacoes: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const FORMULARIO_VAZIO: FormularioUnidade = {
  nome: '',
  cnes: '',
  cnpj: '',
  telefone: '',
  email: '',
  timezone: 'America/Sao_Paulo',
  observacoes: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

export default function UnidadesPage() {
  const queryClient = useQueryClient();
  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [emEdicao, setEmEdicao] = React.useState<UnidadeDto | null>(null);
  const [formulario, setFormulario] = React.useState<FormularioUnidade>(FORMULARIO_VAZIO);
  const [inativando, setInativando] = React.useState<UnidadeDto | null>(null);
  const [somenteAtivas, setSomenteAtivas] = React.useState(true);

  const consulta = useQuery({
    queryKey: ['organizacao', 'unidades', { somenteAtivas }],
    queryFn: () => organizacaoService.listarUnidades({ ativo: somenteAtivas }),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: formulario.nome,
        cnes: formulario.cnes || null,
        cnpj: formulario.cnpj || null,
        telefone: formulario.telefone || null,
        email: formulario.email || null,
        timezone: formulario.timezone,
        observacoes: formulario.observacoes || null,
        endereco: {
          cep: formulario.cep || null,
          logradouro: formulario.logradouro || null,
          numero: formulario.numero || null,
          complemento: formulario.complemento || null,
          bairro: formulario.bairro || null,
          cidade: formulario.cidade || null,
          uf: formulario.uf || null,
        },
      };

      return emEdicao
        ? organizacaoService.atualizarUnidade(emEdicao.id, payload)
        : organizacaoService.criarUnidade(payload);
    },
    onSuccess: () => {
      toast.success(emEdicao ? 'Unidade atualizada' : 'Unidade criada');
      setDialogoAberto(false);
      setEmEdicao(null);
      queryClient.invalidateQueries({ queryKey: ['organizacao'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacao = useMutation({
    mutationFn: (unidade: UnidadeDto) =>
      unidade.ativo ? organizacaoService.inativarUnidade(unidade.id) : organizacaoService.reativarUnidade(unidade.id),
    onSuccess: (unidade) => {
      toast.success(unidade.ativo ? 'Unidade reativada' : 'Unidade inativada');
      setInativando(null);
      queryClient.invalidateQueries({ queryKey: ['organizacao'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirNova() {
    setEmEdicao(null);
    setFormulario(FORMULARIO_VAZIO);
    setDialogoAberto(true);
  }

  function abrirEdicao(unidade: UnidadeDto) {
    setEmEdicao(unidade);
    setFormulario({
      nome: unidade.nome,
      cnes: unidade.cnes ?? '',
      cnpj: unidade.cnpj ?? '',
      telefone: unidade.telefone ?? '',
      email: unidade.email ?? '',
      timezone: unidade.timezone,
      observacoes: unidade.observacoes ?? '',
      cep: unidade.endereco.cep ?? '',
      logradouro: unidade.endereco.logradouro ?? '',
      numero: unidade.endereco.numero ?? '',
      complemento: unidade.endereco.complemento ?? '',
      bairro: unidade.endereco.bairro ?? '',
      cidade: unidade.endereco.cidade ?? '',
      uf: unidade.endereco.uf ?? '',
    });
    setDialogoAberto(true);
  }

  const colunas = React.useMemo<ColumnDef<UnidadeDto, unknown>[]>(
    () => [
      {
        id: 'nome',
        header: 'Unidade',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.nome}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.cnes ? `CNES ${row.original.cnes}` : 'sem CNES'}
            </p>
          </div>
        ),
      },
      {
        id: 'endereco',
        header: 'Endereço',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.enderecoFormatado || '—'}</span>
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
        id: 'timezone',
        header: 'Fuso horário',
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden />
            {row.original.timezone}
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
                  Editar
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
    [],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Unidades"
        descricao="Cada unidade tem endereço, CNES e fuso horário próprios — o fuso define como os horários da agenda são exibidos e armazenados."
        acoes={
          <>
            <Button
              variant="outline"
              onClick={() => setSomenteAtivas((valor) => !valor)}
            >
              {somenteAtivas ? 'Incluir inativas' : 'Somente ativas'}
            </Button>
            <Button onClick={abrirNova}>
              <Plus aria-hidden />
              Nova unidade
            </Button>
          </>
        }
      />

      <DataTable
        colunas={colunas}
        dados={consulta.data ?? []}
        carregando={consulta.isLoading}
        estadoVazio={
          <EstadoVazio
            titulo="Nenhuma unidade cadastrada"
            descricao="Cadastre a primeira unidade para liberar agenda, recepção e prontuário."
            icone={Building2}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sobre fusos horários</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Os agendamentos são gravados em UTC e exibidos no fuso da unidade. Ao criar unidades em estados
          diferentes, confirme o fuso para evitar deslocamento de horários na agenda e na recepção.
        </CardContent>
      </Card>

      <Dialog
        open={dialogoAberto}
        onOpenChange={(aberto) => {
          setDialogoAberto(aberto);
          if (!aberto) setEmEdicao(null);
        }}
      >
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar unidade' : 'Nova unidade'}</DialogTitle>
            <DialogDescription>
              O endereço e o telefone cadastrados aqui aparecem no cabeçalho dos documentos clínicos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="unidade-nome">Nome da unidade *</Label>
              <Input
                id="unidade-nome"
                value={formulario.nome}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nome: evento.target.value }))}
                placeholder="Ex.: Unidade Centro"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-cnes">CNES</Label>
              <Input
                id="unidade-cnes"
                value={formulario.cnes}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, cnes: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-cnpj">CNPJ</Label>
              <Input
                id="unidade-cnpj"
                value={formulario.cnpj}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, cnpj: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-telefone">Telefone</Label>
              <Input
                id="unidade-telefone"
                value={formulario.telefone}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, telefone: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-email">E-mail</Label>
              <Input
                id="unidade-email"
                type="email"
                value={formulario.email}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, email: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="unidade-timezone">Fuso horário *</Label>
              <select
                id="unidade-timezone"
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formulario.timezone}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, timezone: evento.target.value }))}
              >
                {FUSOS.map((fuso) => (
                  <option key={fuso} value={fuso}>
                    {fuso}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-cep">CEP</Label>
              <Input
                id="unidade-cep"
                value={formulario.cep}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, cep: evento.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-logradouro">Logradouro</Label>
              <Input
                id="unidade-logradouro"
                value={formulario.logradouro}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, logradouro: evento.target.value }))}
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="unidade-numero">Número</Label>
                <Input
                  id="unidade-numero"
                  value={formulario.numero}
                  onChange={(evento) => setFormulario((anterior) => ({ ...anterior, numero: evento.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unidade-complemento">Complemento</Label>
                <Input
                  id="unidade-complemento"
                  value={formulario.complemento}
                  onChange={(evento) =>
                    setFormulario((anterior) => ({ ...anterior, complemento: evento.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unidade-bairro">Bairro</Label>
              <Input
                id="unidade-bairro"
                value={formulario.bairro}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, bairro: evento.target.value }))}
              />
            </div>

            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="unidade-cidade">Cidade</Label>
                <Input
                  id="unidade-cidade"
                  value={formulario.cidade}
                  onChange={(evento) => setFormulario((anterior) => ({ ...anterior, cidade: evento.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unidade-uf">UF</Label>
                <Input
                  id="unidade-uf"
                  maxLength={2}
                  className="uppercase"
                  value={formulario.uf}
                  onChange={(evento) =>
                    setFormulario((anterior) => ({ ...anterior, uf: evento.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="unidade-observacoes">Observações</Label>
              <Textarea
                id="unidade-observacoes"
                rows={2}
                value={formulario.observacoes}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, observacoes: evento.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => salvar.mutate()} carregando={salvar.isPending} disabled={formulario.nome.trim().length < 2}>
              {emEdicao ? 'Salvar alterações' : 'Criar unidade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(inativando)}
        aoMudar={(aberto) => !aberto && setInativando(null)}
        titulo={inativando?.ativo ? 'Inativar unidade' : 'Reativar unidade'}
        descricao={
          inativando?.ativo
            ? `${inativando?.nome} deixa de aceitar novos agendamentos. O histórico da unidade é preservado.`
            : `${inativando?.nome} volta a aceitar agendamentos e a aparecer nos seletores.`
        }
        textoConfirmar={inativando?.ativo ? 'Inativar' : 'Reativar'}
        carregando={alterarSituacao.isPending}
        onConfirmar={() => inativando && alterarSituacao.mutate(inativando)}
      />
    </div>
  );
}
