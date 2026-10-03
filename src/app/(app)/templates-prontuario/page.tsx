'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileSignature, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
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
import {
  prontuarioService,
  type TemplateProntuarioDto,
} from '@/client/services/prontuario.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useDebounce } from '@/client/hooks/use-debounce';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { formatarDataHora } from '@/client/lib/format';

const ESPECIALIDADES_SUGERIDAS = [
  'clínica geral',
  'pediatria',
  'ginecologia',
  'ortopedia',
  'dermatologia',
  'cardiologia',
  'psiquiatria',
];

export default function TemplatesProntuarioPage() {
  const queryClient = useQueryClient();
  const { pode } = usePermissoes();

  const [busca, setBusca] = React.useState('');
  const [especialidade, setEspecialidade] = React.useState('todas');
  const [somenteAtivos, setSomenteAtivos] = React.useState(true);

  const [criando, setCriando] = React.useState(false);
  const [emEdicao, setEmEdicao] = React.useState<TemplateProntuarioDto | null>(null);
  const [clonando, setClonando] = React.useState<TemplateProntuarioDto | null>(null);
  const [inativando, setInativando] = React.useState<TemplateProntuarioDto | null>(null);

  const buscaDebounced = useDebounce(busca, 400);

  const [formulario, setFormulario] = React.useState({
    nome: '',
    especialidade: 'clínica geral',
    descricao: '',
    secoesJson: '',
  });

  const consulta = useQuery({
    queryKey: ['templates-prontuario', { buscaDebounced, especialidade, somenteAtivos }],
    queryFn: () =>
      prontuarioService.listarTemplates({
        busca: buscaDebounced || undefined,
        especialidade: especialidade === 'todas' ? undefined : especialidade,
      }),
  });

  const itens = (consulta.data?.items ?? []).filter((item) => (somenteAtivos ? item.ativo : true));

  const salvar = useMutation({
    mutationFn: async () => {
      const secoes = formulario.secoesJson.trim() ? JSON.parse(formulario.secoesJson) : undefined;

      if (emEdicao) {
        return prontuarioService.atualizarTemplate(emEdicao.id, {
          nome: formulario.nome,
          especialidade: formulario.especialidade,
          descricao: formulario.descricao || null,
          secoes,
        });
      }

      return prontuarioService.criarTemplate({
        nome: formulario.nome,
        especialidade: formulario.especialidade,
        descricao: formulario.descricao || null,
        secoes: secoes ?? [],
      });
    },
    onSuccess: () => {
      toast.success(emEdicao ? 'Template atualizado (nova versão criada)' : 'Template criado');
      setCriando(false);
      setEmEdicao(null);
      queryClient.invalidateQueries({ queryKey: ['templates-prontuario'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const clonar = useMutation({
    mutationFn: (template: TemplateProntuarioDto) =>
      prontuarioService.clonarTemplate(template.id, {
        nome: `${template.nome} (cópia)`,
        especialidade: template.especialidade,
      }),
    onSuccess: () => {
      toast.success('Template clonado — ajuste os campos conforme a necessidade da rede');
      setClonando(null);
      queryClient.invalidateQueries({ queryKey: ['templates-prontuario'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const alterarSituacao = useMutation({
    mutationFn: (template: TemplateProntuarioDto) =>
      template.ativo
        ? prontuarioService.inativarTemplate(template.id)
        : prontuarioService.reativarTemplate(template.id),
    onSuccess: (template) => {
      toast.success(template.ativo ? 'Template reativado' : 'Template inativado');
      setInativando(null);
      queryClient.invalidateQueries({ queryKey: ['templates-prontuario'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function abrirCriacao() {
    setEmEdicao(null);
    setFormulario({
      nome: '',
      especialidade: 'clínica geral',
      descricao: '',
      secoesJson: JSON.stringify(
        [
          {
            id: 'avaliacao',
            titulo: 'Avaliação',
            campos: [
              {
                id: 'sintomas',
                rotulo: 'Sintomas relatados',
                tipo: 'texto_longo',
                obrigatorio: true,
              },
            ],
          },
        ],
        null,
        2,
      ),
    });
    setCriando(true);
  }

  function abrirEdicao(template: TemplateProntuarioDto) {
    setEmEdicao(template);
    setFormulario({
      nome: template.nome,
      especialidade: template.especialidade,
      descricao: template.descricao ?? '',
      secoesJson: JSON.stringify(template.estrutura.secoes, null, 2),
    });
    setCriando(true);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Templates de prontuário"
        descricao="Modelos por especialidade com seções e campos. Definir um template como padrão faz com que novos atendimentos daquela especialidade já venham preenchidos com ele."
        acoes={
          pode('templates:gerenciar') ? (
            <Button onClick={abrirCriacao}>
              <Plus aria-hidden />
              Novo template
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome ou descrição"
            className="flex-1"
            aria-label="Buscar templates"
          />
          <Select value={especialidade} onValueChange={setEspecialidade}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as especialidades</SelectItem>
              {[...new Set([...(consulta.data?.especialidades ?? []), ...ESPECIALIDADES_SUGERIDAS])].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSomenteAtivos((valor) => !valor)}>
            {somenteAtivos ? 'Incluir inativos' : 'Somente ativos'}
          </Button>
        </CardContent>
      </Card>

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={5} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum template encontrado"
          descricao="A rede já vem com modelos padrão por especialidade — clone um existente para personalizar."
          icone={FileSignature}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Campos</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <p className="font-medium">{template.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.descricao ?? `${template.estrutura.secoes.length} seção(ões)`} · atualizado em{' '}
                        {formatarDataHora(template.updatedAt)}
                      </p>
                    </TableCell>
                    <TableCell className="capitalize">{template.especialidade}</TableCell>
                    <TableCell className="tabular-nums">{template.totalCampos}</TableCell>
                    <TableCell>
                      <Badge variant="outline">v{template.versao}</Badge>
                      {template.isPadrao ? <Badge variant="info">padrão</Badge> : null}
                      {template.origem === 'proprio' ? (
                        <Badge variant="secondary">personalizado</Badge>
                      ) : template.origem === 'clonado' ? (
                        <Badge variant="secondary">clonado</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.ativo ? 'success' : 'secondary'}>
                        {template.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pode('templates:gerenciar') ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Ações de ${template.nome}`}>
                              <MoreHorizontal aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => abrirEdicao(template)}>
                              <Pencil aria-hidden />
                              Editar estrutura
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setClonando(template)}>
                              <Copy aria-hidden />
                              Clonar para a rede
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variante="destructive" onClick={() => setInativando(template)}>
                              {template.ativo ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
                              {template.ativo ? 'Inativar' : 'Reativar'}
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
        open={criando}
        onOpenChange={(aberto) => {
          setCriando(aberto);
          if (!aberto) setEmEdicao(null);
        }}
      >
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>{emEdicao ? 'Editar template' : 'Novo template de prontuário'}</DialogTitle>
            <DialogDescription>
              A estrutura é um JSON com seções ordenadas. Tipos de campo aceitos: texto_curto, texto_longo,
              numero, data, selecao_unica, selecao_multipla, escala, sim_nao e anexo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-nome">Nome *</Label>
              <Input
                id="template-nome"
                value={formulario.nome}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, nome: evento.target.value }))}
                placeholder="Ex.: Consulta de pediatria"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="template-especialidade">Especialidade *</Label>
              <Input
                id="template-especialidade"
                list="especialidades-sugeridas"
                value={formulario.especialidade}
                onChange={(evento) =>
                  setFormulario((anterior) => ({ ...anterior, especialidade: evento.target.value }))
                }
              />
              <datalist id="especialidades-sugeridas">
                {ESPECIALIDADES_SUGERIDAS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="template-descricao">Descrição</Label>
              <Input
                id="template-descricao"
                value={formulario.descricao}
                onChange={(evento) =>
                  setFormulario((anterior) => ({ ...anterior, descricao: evento.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="template-secoes">Estrutura (JSON)</Label>
              <Textarea
                id="template-secoes"
                rows={14}
                className="font-mono text-xs"
                value={formulario.secoesJson}
                onChange={(evento) => setFormulario((anterior) => ({ ...anterior, secoesJson: evento.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Cada campo precisa de <code>id</code> em minúsculas, <code>rotulo</code> e <code>tipo</code>. Campos
                de seleção exigem ao menos duas <code>opcoes</code>; campos de escala usam <code>min</code> e{' '}
                <code>max</code>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCriando(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvar.mutate()}
              carregando={salvar.isPending}
              disabled={formulario.nome.trim().length < 3}
            >
              {emEdicao ? 'Salvar nova versão' : 'Criar template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(clonando)}
        aoMudar={(aberto) => !aberto && setClonando(null)}
        titulo="Clonar template"
        descricao={`Uma cópia editável de "${clonando?.nome ?? ''}" será criada para esta rede. O template original não é alterado.`}
        textoConfirmar="Clonar"
        carregando={clonar.isPending}
        onConfirmar={() => clonando && clonar.mutate(clonando)}
      />

      <ConfirmDialog
        aberto={Boolean(inativando)}
        aoMudar={(aberto) => !aberto && setInativando(null)}
        titulo={inativando?.ativo ? 'Inativar template' : 'Reativar template'}
        descricao={
          inativando?.ativo
            ? `"${inativando?.nome}" deixa de aparecer para novos atendimentos. Prontuários já criados continuam acessíveis com a versão usada.`
            : `"${inativando?.nome}" volta a ficar disponível na abertura de novos atendimentos.`
        }
        textoConfirmar={inativando?.ativo ? 'Inativar' : 'Reativar'}
        carregando={alterarSituacao.isPending}
        onConfirmar={() => inativando && alterarSituacao.mutate(inativando)}
      />
    </div>
  );
}
