'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { DataTable } from '@/client/ui/data-display/data-table.component';
import type { ColunaTabela } from '@/client/ui/data-display/data-table.component';
import { PaginationNav } from '@/client/ui/navigation/pagination-nav.component';
import { SearchInput } from '@/client/ui/forms/search-input.component';
import { useDebounce } from '@/client/hooks/use-debounce.hook';
import type { RegistroAuditoriaResponseDto } from '../../dtos/auditoria.response.dto';
import type { AcessoProntuarioRegistro } from '../../../domain/repositories/auditoria-repository.interface';
import { auditoriaApiService } from '../../services/auditoria-api.service';

function dataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(
    new Date(iso),
  );
}

export function AuditoriaPage() {
  const [entidade, setEntidade] = useState('');
  const [pagina, setPagina] = useState(1);
  const entidadeDebounced = useDebounce({ valor: entidade });

  const registros = useQuery({
    queryKey: ['auditoria', entidadeDebounced, pagina],
    queryFn: () =>
      auditoriaApiService.listar({
        entidade: entidadeDebounced || null,
        pagina,
        porPagina: 20,
      }),
  });

  const acessos = useQuery({
    queryKey: ['auditoria', 'prontuarios'],
    queryFn: () => auditoriaApiService.listarAcessosProntuario({ limite: 50 }),
  });

  const colunas: ColunaTabela<RegistroAuditoriaResponseDto>[] = [
    {
      chave: 'quando',
      titulo: 'Quando',
      render: (registro) => <span className="text-sm tabular-nums">{dataHora(registro.criadoEm)}</span>,
    },
    {
      chave: 'usuario',
      titulo: 'Usuário',
      render: (registro) => <span className="text-sm">{registro.usuarioNome ?? '—'}</span>,
    },
    {
      chave: 'acao',
      titulo: 'Ação',
      render: (registro) => <Badge variant="secondary">{registro.acaoRotulo}</Badge>,
    },
    {
      chave: 'entidade',
      titulo: 'Entidade',
      render: (registro) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{registro.entidade}</p>
          <p className="truncate text-xs text-muted-foreground">{registro.entidadeId ?? '—'}</p>
        </div>
      ),
    },
    {
      chave: 'origem',
      titulo: 'Origem',
      className: 'hidden lg:table-cell',
      render: (registro) => (
        <span className="text-xs text-muted-foreground">{registro.ip ?? '—'}</span>
      ),
    },
  ];

  const colunasAcessos: ColunaTabela<AcessoProntuarioRegistro>[] = [
    {
      chave: 'quando',
      titulo: 'Quando',
      render: (acesso) => <span className="text-sm tabular-nums">{dataHora(acesso.criadoEm)}</span>,
    },
    {
      chave: 'usuario',
      titulo: 'Usuário',
      render: (acesso) => <span className="text-sm">{acesso.usuarioNome ?? '—'}</span>,
    },
    {
      chave: 'paciente',
      titulo: 'Paciente',
      render: (acesso) => <span className="text-sm">{acesso.pacienteNome}</span>,
    },
  ];

  return (
    <PageContainer>
      <PageTitle
        titulo="Auditoria"
        descricao="Registro de todas as ações do sistema e dos acessos a prontuários (LGPD)."
      />

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Ações do sistema</TabsTrigger>
          <TabsTrigger value="prontuarios">Acessos a prontuários</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <SearchInput
                valor={entidade}
                aoAlterar={(valor) => {
                  setEntidade(valor);
                  setPagina(1);
                }}
                placeholder="Filtrar por entidade (ex.: paciente)…"
                rotulo="Filtrar auditoria"
              />
            </CardContent>
          </Card>

          <DataTable
            colunas={colunas}
            itens={registros.data?.itens ?? []}
            chaveDoItem={(registro) => registro.id}
            carregando={registros.isLoading}
            mensagemVazia="Nenhum registro de auditoria"
          />
          <PaginationNav
            pagina={registros.data?.meta.page ?? 1}
            totalPaginas={registros.data?.meta.totalPages ?? 1}
            total={registros.data?.meta.total ?? 0}
            aoMudarPagina={setPagina}
          />
        </TabsContent>

        <TabsContent value="prontuarios">
          <DataTable
            colunas={colunasAcessos}
            itens={acessos.data ?? []}
            chaveDoItem={(acesso) => acesso.id}
            carregando={acessos.isLoading}
            mensagemVazia="Nenhum acesso registrado"
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
