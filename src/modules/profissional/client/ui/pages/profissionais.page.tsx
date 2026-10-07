'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { DataTable } from '@/client/ui/data-display/data-table.component';
import type { ColunaTabela } from '@/client/ui/data-display/data-table.component';
import { SearchInput } from '@/client/ui/forms/search-input.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { useDebounce } from '@/client/hooks/use-debounce.hook';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { unidadeApiService } from '@/modules/unidade/client/services/unidade-api.service';
import { CONSELHOS } from '../../../domain/value-objects/registro-conselho.vo';
import { ESPECIALIDADES_PADRAO } from '../../../domain/value-objects/especialidade.vo';
import type { ProfissionalResponseDto } from '../../dtos/profissional.response.dto';
import { profissionalApiService } from '../../services/profissional-api.service';

type FormularioProfissional = {
  nome: string;
  conselho: string;
  numeroConselho: string;
  ufConselho: string;
  especialidade: string;
  email: string;
  telefone: string;
  unidadeId: string;
};

const FORMULARIO_VAZIO: FormularioProfissional = {
  nome: '',
  conselho: 'CRM',
  numeroConselho: '',
  ufConselho: 'SP',
  especialidade: '',
  email: '',
  telefone: '',
  unidadeId: '',
};

export function ProfissionaisPage() {
  const queryClient = useQueryClient();
  const { pode } = useAutenticacao();
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioProfissional>(FORMULARIO_VAZIO);
  const buscaDebounced = useDebounce({ valor: busca });

  const profissionais = useQuery({
    queryKey: ['profissionais', buscaDebounced],
    queryFn: () => profissionalApiService.listar({ busca: buscaDebounced || undefined }),
  });

  const unidades = useQuery({
    queryKey: ['unidades', 'ativas'],
    queryFn: () => unidadeApiService.listar({ apenasAtivas: true }),
  });

  const criar = useMutation({
    mutationFn: () =>
      profissionalApiService.criar({
        nome: formulario.nome,
        conselho: formulario.conselho,
        numeroConselho: formulario.numeroConselho,
        ufConselho: formulario.ufConselho,
        especialidade: formulario.especialidade,
        email: formulario.email || null,
        telefone: formulario.telefone || null,
        unidades: formulario.unidadeId ? [formulario.unidadeId] : [],
      }),
    onSuccess: () => {
      toast.success('Profissional cadastrado');
      void queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      setFormulario(FORMULARIO_VAZIO);
      setAberto(false);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const colunas: ColunaTabela<ProfissionalResponseDto>[] = [
    {
      chave: 'nome',
      titulo: 'Profissional',
      render: (profissional) => (
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-1 rounded-full"
            style={{ backgroundColor: profissional.corAgenda }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{profissional.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{profissional.especialidade}</p>
          </div>
        </div>
      ),
    },
    {
      chave: 'registro',
      titulo: 'Registro',
      render: (profissional) => (
        <span className="text-sm">{profissional.registroFormatado}</span>
      ),
    },
    {
      chave: 'contato',
      titulo: 'Contato',
      className: 'hidden md:table-cell',
      render: (profissional) => (
        <span className="text-sm text-muted-foreground">{profissional.email ?? '—'}</span>
      ),
    },
    {
      chave: 'status',
      titulo: 'Situação',
      render: (profissional) => (
        <Badge variant={profissional.ativo ? 'success' : 'outline'}>
          {profissional.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  function alterar(campo: keyof FormularioProfissional, valor: string): void {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <PageContainer>
      <PageTitle
        titulo="Profissionais"
        descricao="Equipe assistencial da rede e suas unidades de atuação."
        acoes={
          pode('profissional:escrever') ? (
            <Button onClick={() => setAberto(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Novo profissional
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-4">
          <SearchInput valor={busca} aoAlterar={setBusca} placeholder="Buscar por nome…" />
        </CardContent>
      </Card>

      <DataTable
        colunas={colunas}
        itens={profissionais.data ?? []}
        chaveDoItem={(profissional) => profissional.id}
        carregando={profissionais.isLoading}
        mensagemVazia="Nenhum profissional cadastrado"
      />

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo profissional</DialogTitle>
            <DialogDescription>
              O registro no conselho de classe é único por rede.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField rotulo="Nome" obrigatorio className="sm:col-span-2">
              <Input value={formulario.nome} onChange={(e) => alterar('nome', e.target.value)} />
            </FormField>
            <FormField rotulo="Conselho" obrigatorio>
              <Select
                value={formulario.conselho}
                onValueChange={(valor) => alterar('conselho', valor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSELHOS.map((conselho) => (
                    <SelectItem key={conselho} value={conselho}>
                      {conselho}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField rotulo="Número do conselho" obrigatorio>
              <Input
                value={formulario.numeroConselho}
                onChange={(e) => alterar('numeroConselho', e.target.value)}
              />
            </FormField>
            <FormField rotulo="UF do conselho">
              <Input
                value={formulario.ufConselho}
                maxLength={2}
                onChange={(e) => alterar('ufConselho', e.target.value.toUpperCase())}
              />
            </FormField>
            <FormField rotulo="Especialidade" obrigatorio>
              <Select
                value={formulario.especialidade}
                onValueChange={(valor) => alterar('especialidade', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIALIDADES_PADRAO.map((especialidade) => (
                    <SelectItem key={especialidade} value={especialidade}>
                      {especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField rotulo="E-mail">
              <Input
                type="email"
                value={formulario.email}
                onChange={(e) => alterar('email', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Telefone">
              <Input
                value={formulario.telefone}
                onChange={(e) => alterar('telefone', e.target.value)}
              />
            </FormField>
            <FormField rotulo="Unidade principal" className="sm:col-span-2">
              <Select
                value={formulario.unidadeId}
                onValueChange={(valor) => alterar('unidadeId', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.data?.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
              <Stethoscope className="h-4 w-4" aria-hidden />
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
