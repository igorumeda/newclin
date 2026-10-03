'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, MoreHorizontal, Palette, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input, Textarea } from '@/client/ui/input';
import { Label, Checkbox } from '@/client/ui/controls';
import { EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { agendaService, type TipoAtendimentoDto } from '@/client/services/agenda.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';

type FormularioTipo = {
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  cor: string;
  requerConfirmacao: boolean;
};

const FORMULARIO_VAZIO: FormularioTipo = {
  nome: '',
  descricao: '',
  duracaoMinutos: 30,
  cor: '#0ea5e9',
  requerConfirmacao: false,
};

/** Tipos de atendimento da rede: duração e cor alimentam a agenda (§3.4). */
export function TabelaTiposAtendimento() {
  const queryClient = useQueryClient();
  const { ehAdmin } = usePermissoes();

  const [dialogoAberto, setDialogoAberto] = React.useState(false);
  const [emEdicao, setEmEdicao] = React.useState<TipoAtendimentoDto | null>(null);
  const [formulario, setFormulario] = React.useState<FormularioTipo>(FORMULARIO_VAZIO);
  const [inativando, setInativando] = React.useState<TipoAtendimentoDto | null>(null);

  const consulta = useQuery({
    queryKey: ['tipos-atendimento', 'todos'],
    queryFn: () => agendaService.listarTiposAtendimento({ somenteAtivos: false }),
  });

  const salvar = useMutation({
    mutationFn: () =>
      emEdicao
        ? agendaService.atualizarTipoAtendimento(emEdicao.id, formulario)
        : agendaService.criarTipoAtendimento(formulario),
    onSuccess: () => {
      toast.success(emEdicao ? 'Tipo de atendimento atualizado' : 'Tipo de atendimento criado');
      setDialogoAberto(false);
      setEmEdicao(null);
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacao = useMutation({
    mutationFn: (tipo: TipoAtendimentoDto) =>
      tipo.ativo
        ? agendaService.inativarTipoAtendimento(tipo.id)
        : agendaService.reativarTipoAtendimento(tipo.id),
    onSuccess: (tipo) => {
      toast.success(tipo.ativo ? 'Tipo reativado' : 'Tipo inativado');
      setInativando(null);
      queryClient.invalidateQueries({ queryKey: ['tipos-atendimento'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirNovo() {
    setEmEdicao(null);
    setFormulario(FORMULARIO_VAZIO);
    setDialogoAberto(true);
  }

  function abrirEdicao(tipo: TipoAtendimentoDto) {
    setEmEdicao(tipo);
    setFormulario({
      nome: tipo.nome,
      descricao: tipo.descricao ?? '',
      duracaoMinutos: tipo.duracaoMinutos,
      cor: tipo.cor,
      requerConfirmacao: tipo.requerConfirmacao,
    });
    setDialogoAberto(true);
  }

  const itens = consulta.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          A duração define o tamanho do bloco na agenda e a cor identifica o tipo na grade e na recepção.
        </p>
        {ehAdmin ? (
          <Button onClick={abrirNovo}>
            <Plus aria-hidden />
            Novo tipo
          </Button>
        ) : null}
      </div>

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={4} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum tipo de atendimento"
          descricao="Cadastre tipos como consulta, retorno e procedimento para padronizar a agenda."
          icone={Clock}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Confirmação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block size-3 rounded-full"
                          style={{ backgroundColor: tipo.cor }}
                        />
                        <div>
                          <p className="font-medium">{tipo.nome}</p>
                          {tipo.descricao ? (
                            <p className="text-xs text-muted-foreground">{tipo.descricao}</p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{tipo.duracaoMinutos} min</TableCell>
                    <TableCell>
                      {tipo.requerConfirmacao ? (
                        <Badge variant="info">exige confirmação</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">automática</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tipo.ativo ? 'success' : 'secondary'}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {ehAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Ações de ${tipo.nome}`}>
                              <MoreHorizontal aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => abrirEdicao(tipo)}>
                              <Pencil aria-hidden />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variante="destructive" onClick={() => setInativando(tipo)}>
                              {tipo.ativo ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
                              {tipo.ativo ? 'Inativar' : 'Reativar'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={dialogoAberto}
        onOpenChange={(aberto) => {
          setDialogoAberto(aberto);
          if (!aberto) setEmEdicao(null);
        }}
      >
        <DialogContent tamanho="sm">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar tipo de atendimento' : 'Novo tipo de atendimento'}</DialogTitle>
            <DialogDescription>
              Tipos inativos continuam aparecendo nos agendamentos já existentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tipo-nome">Nome *</Label>
              <Input
                id="tipo-nome"
                value={formulario.nome}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nome: evento.target.value }))}
                placeholder="Ex.: Consulta de rotina"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tipo-descricao">Descrição</Label>
              <Textarea
                id="tipo-descricao"
                rows={2}
                value={formulario.descricao}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, descricao: evento.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipo-duracao">Duração (min) *</Label>
                <Input
                  id="tipo-duracao"
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={formulario.duracaoMinutos}
                  onChange={(evento) =>
                    setFormulario((anterior) => ({ ...anterior, duracaoMinutos: Number(evento.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo-cor" className="flex items-center gap-1">
                  <Palette className="size-3" aria-hidden />
                  Cor na agenda
                </Label>
                <Input
                  id="tipo-cor"
                  type="color"
                  className="h-11 p-1"
                  value={formulario.cor}
                  onChange={(evento) => setFormulario((anterior) => ({ ...anterior, cor: evento.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={formulario.requerConfirmacao}
                onCheckedChange={(valor) =>
                  setFormulario((anterior) => ({ ...anterior, requerConfirmacao: valor === true }))
                }
              />
              <span>
                Exigir confirmação do paciente
                <span className="block text-xs text-muted-foreground">
                  Notifica o paciente na criação e aguarda a confirmação (e-mail/WhatsApp).
                </span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvar.mutate()}
              carregando={salvar.isPending}
              disabled={formulario.nome.trim().length < 2}
            >
              {emEdicao ? 'Salvar alterações' : 'Criar tipo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(inativando)}
        aoMudar={(aberto) => !aberto && setInativando(null)}
        titulo={inativando?.ativo ? 'Inativar tipo de atendimento' : 'Reativar tipo de atendimento'}
        descricao={
          inativando?.ativo
            ? `"${inativando?.nome}" deixa de aparecer nos novos agendamentos.`
            : `"${inativando?.nome}" volta a ficar disponível na agenda.`
        }
        textoConfirmar={inativando?.ativo ? 'Inativar' : 'Reativar'}
        carregando={alterarSituacao.isPending}
        onConfirmar={() => inativando && alterarSituacao.mutate(inativando)}
      />
    </div>
  );
}
