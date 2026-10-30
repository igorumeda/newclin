'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  Building2,
  Globe,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/client/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/ui/select';
import { DataTable } from '@/client/ui/data-table';
import { EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import {
  masterService,
  type ResumoMasterRedeItemDto,
} from '@/client/services/master.service';
import { formatarData, formatarDataHora, formatarNumero } from '@/client/lib/format';

type FiltrarRedesMasterParams = {
  redes: ResumoMasterRedeItemDto[];
  busca: string;
  situacao: 'todas' | 'ativas' | 'inativas';
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

const colunasRedes: ColumnDef<ResumoMasterRedeItemDto, unknown>[] = [
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
              {item.slug ? (
                <Badge variant="outline" className="text-[11px]">
                  /{item.slug}
                </Badge>
              ) : null}
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
];

export function PainelMaster() {
  const [busca, setBusca] = React.useState('');
  const [situacao, setSituacao] = React.useState<'todas' | 'ativas' | 'inativas'>(
    'todas',
  );

  const consulta = useQuery({
    queryKey: ['master', 'redes', 'resumo'],
    queryFn: () => masterService.obterResumoRedes(),
    refetchInterval: 60 * 1000,
  });

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
            <Button asChild>
              <Link href="/usuarios">
                <ShieldCheck aria-hidden />
                Usuários Master
              </Link>
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
                descricao="Não há redes que correspondam aos filtros informados."
                icone={Building2}
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

