'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { DataTable } from '@/client/ui/data-display/data-table.component';
import type { ColunaTabela } from '@/client/ui/data-display/data-table.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { useAutenticacao } from '@/client/providers/auth-provider';
import type { UnidadeResponseDto } from '../../dtos/unidade.response.dto';
import { unidadeApiService } from '../../services/unidade-api.service';

type FormularioUnidade = {
  nome: string;
  codigo: string;
  telefone: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  fusoHorario: string;
};

const FORMULARIO_VAZIO: FormularioUnidade = {
  nome: '',
  codigo: '',
  telefone: '',
  email: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: 'SP',
  cep: '',
  fusoHorario: 'America/Sao_Paulo',
};

export function UnidadesPage() {
  const queryClient = useQueryClient();
  const { pode } = useAutenticacao();
  const [aberto, setAberto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioUnidade>(FORMULARIO_VAZIO);

  const unidades = useQuery({
    queryKey: ['unidades'],
    queryFn: () => unidadeApiService.listar({}),
  });

  const criar = useMutation({
    mutationFn: () =>
      unidadeApiService.criar({
        nome: formulario.nome,
        codigo: formulario.codigo || null,
        telefone: formulario.telefone || null,
        email: formulario.email || null,
        fusoHorario: formulario.fusoHorario,
        endereco: {
          logradouro: formulario.logradouro,
          numero: formulario.numero,
          bairro: formulario.bairro,
          cidade: formulario.cidade,
          uf: formulario.uf,
          cep: formulario.cep,
        },
      }),
    onSuccess: () => {
      toast.success('Unidade criada');
      void queryClient.invalidateQueries({ queryKey: ['unidades'] });
      setFormulario(FORMULARIO_VAZIO);
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const colunas: ColunaTabela<UnidadeResponseDto>[] = [
    {
      chave: 'nome',
      titulo: 'Unidade',
      render: (unidade) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{unidade.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{unidade.codigo ?? '—'}</p>
        </div>
      ),
    },
    {
      chave: 'endereco',
      titulo: 'Endereço',
      className: 'hidden md:table-cell',
      render: (unidade) => <span className="text-sm">{unidade.enderecoCompleto || '—'}</span>,
    },
    {
      chave: 'contato',
      titulo: 'Contato',
      render: (unidade) => <span className="text-sm">{unidade.telefone ?? '—'}</span>,
    },
    {
      chave: 'fuso',
      titulo: 'Fuso',
      className: 'hidden lg:table-cell',
      render: (unidade) => <span className="text-sm">{unidade.fusoHorario}</span>,
    },
    {
      chave: 'status',
      titulo: 'Situação',
      render: (unidade) => (
        <Badge variant={unidade.ativo ? 'success' : 'outline'}>
          {unidade.ativo ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
  ];

  function alterar(campo: keyof FormularioUnidade, valor: string): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <PageContainer>
      <PageTitle
        titulo="Unidades"
        descricao="Locais físicos da rede. Cada unidade tem o seu próprio fuso horário."
        acoes={
          pode('unidade:escrever') ? (
            <Button onClick={() => setAberto(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Nova unidade
            </Button>
          ) : null
        }
      />

      <DataTable
        colunas={colunas}
        itens={unidades.data ?? []}
        chaveDoItem={(unidade) => unidade.id}
        carregando={unidades.isLoading}
        mensagemVazia="Nenhuma unidade cadastrada"
      />

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova unidade</DialogTitle>
            <DialogDescription>
              As datas são exibidas no fuso horário configurado aqui.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField rotulo="Nome" obrigatorio className="sm:col-span-2">
              <Input value={formulario.nome} onChange={(e) => alterar('nome', e.target.value)} />
            </FormField>
            <FormField rotulo="Código">
              <Input value={formulario.codigo} onChange={(e) => alterar('codigo', e.target.value)} />
            </FormField>
            <FormField rotulo="Telefone">
              <Input
                value={formulario.telefone}
                onChange={(e) => alterar('telefone', e.target.value)}
              />
            </FormField>
            <FormField rotulo="E-mail">
              <Input
                type="email"
                value={formulario.email}
                onChange={(e) => alterar('email', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Fuso horário">
              <Input
                value={formulario.fusoHorario}
                onChange={(e) => alterar('fusoHorario', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Logradouro">
              <Input
                value={formulario.logradouro}
                onChange={(e) => alterar('logradouro', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Número">
              <Input value={formulario.numero} onChange={(e) => alterar('numero', e.target.value)} />
            </FormField>
            <FormField rotulo="Bairro">
              <Input value={formulario.bairro} onChange={(e) => alterar('bairro', e.target.value)} />
            </FormField>
            <FormField rotulo="Cidade">
              <Input value={formulario.cidade} onChange={(e) => alterar('cidade', e.target.value)} />
            </FormField>
            <FormField rotulo="UF">
              <Input
                value={formulario.uf}
                maxLength={2}
                onChange={(e) => alterar('uf', e.target.value.toUpperCase())}
              />
            </FormField>
            <FormField rotulo="CEP">
              <Input value={formulario.cep} onChange={(e) => alterar('cep', e.target.value)} />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
              <Building2 className="h-4 w-4" aria-hidden />
              Criar unidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
