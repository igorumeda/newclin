'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileUp, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { EmptyState } from '@/client/ui/typography/empty-state.component';
import { DataTable } from '@/client/ui/data-display/data-table.component';
import type { ColunaTabela } from '@/client/ui/data-display/data-table.component';
import { PaginationNav } from '@/client/ui/navigation/pagination-nav.component';
import { SearchInput } from '@/client/ui/forms/search-input.component';
import { useDebounce } from '@/client/hooks/use-debounce.hook';
import { useAutenticacao } from '@/client/providers/auth-provider';
import type { PacienteResponseDto } from '../../dtos/paciente.response.dto';
import { pacienteApiService } from '../../services/paciente-api.service';

export function PacientesPage() {
  const router = useRouter();
  const { pode } = useAutenticacao();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const buscaDebounced = useDebounce({ valor: busca });

  const pacientes = useQuery({
    queryKey: ['pacientes', buscaDebounced, pagina, apenasAtivos],
    queryFn: () =>
      pacienteApiService.listar({
        busca: buscaDebounced || undefined,
        apenasAtivos,
        pagina,
        porPagina: 20,
      }),
  });

  const colunas: ColunaTabela<PacienteResponseDto>[] = [
    {
      chave: 'nome',
      titulo: 'Paciente',
      render: (paciente) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{paciente.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{paciente.cpfFormatado}</p>
        </div>
      ),
    },
    {
      chave: 'idade',
      titulo: 'Idade',
      render: (paciente) => (
        <span className="tabular-nums">
          {paciente.idade} anos{paciente.menorDeIdade ? ' · menor' : ''}
        </span>
      ),
    },
    {
      chave: 'contato',
      titulo: 'Contato',
      className: 'hidden md:table-cell',
      render: (paciente) => (
        <div className="min-w-0 text-sm">
          <p className="truncate">{paciente.telefoneFormatado ?? '—'}</p>
          <p className="truncate text-muted-foreground">{paciente.email ?? '—'}</p>
        </div>
      ),
    },
    {
      chave: 'status',
      titulo: 'Situação',
      render: (paciente) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={paciente.ativo ? 'success' : 'outline'}>
            {paciente.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
          {paciente.consentimentoLgpd ? null : <Badge variant="warning">Sem consentimento</Badge>}
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageTitle
        titulo="Pacientes"
        descricao="Cadastro único por rede, com detecção de duplicidade por CPF."
        acoes={
          pode('paciente:escrever') ? (
            <>
              {pode('paciente:importar') ? (
                <Button variant="outline" asChild>
                  <Link href="/pacientes/importar">
                    <FileUp className="h-4 w-4" aria-hidden />
                    Importar CSV
                  </Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link href="/pacientes/novo">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Novo paciente
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            valor={busca}
            aoAlterar={(valor) => {
              setBusca(valor);
              setPagina(1);
            }}
            placeholder="Buscar por nome ou CPF…"
          />
          <div className="flex items-center gap-2">
            <Switch id="ativos" checked={apenasAtivos} onCheckedChange={setApenasAtivos} />
            <Label htmlFor="ativos">Somente ativos</Label>
          </div>
        </CardContent>
      </Card>

      {!pacientes.isLoading && (pacientes.data?.itens.length ?? 0) === 0 ? (
        <EmptyState
          titulo="Nenhum paciente encontrado"
          descricao="Revise a busca ou cadastre um novo paciente."
          icone={<Users className="h-8 w-8" aria-hidden />}
        />
      ) : (
        <>
          <DataTable
            colunas={colunas}
            itens={pacientes.data?.itens ?? []}
            chaveDoItem={(paciente) => paciente.id}
            carregando={pacientes.isLoading}
            aoClicarNaLinha={(paciente) => router.push(`/pacientes/${paciente.id}`)}
          />
          <PaginationNav
            pagina={pacientes.data?.meta.page ?? 1}
            totalPaginas={pacientes.data?.meta.totalPages ?? 1}
            total={pacientes.data?.meta.total ?? 0}
            aoMudarPagina={setPagina}
          />
        </>
      )}
    </PageContainer>
  );
}
