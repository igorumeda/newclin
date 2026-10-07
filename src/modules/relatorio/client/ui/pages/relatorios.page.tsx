'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { StatCard } from '@/client/ui/data-display/stat-card.component';
import { DataTable } from '@/client/ui/data-display/data-table.component';
import type { ColunaTabela } from '@/client/ui/data-display/data-table.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { LoadingSkeleton } from '@/client/ui/feedback/loading-skeleton.component';
import type { ProdutividadeItem } from '../../../domain/repositories/relatorio-repository.interface';
import { relatorioApiService } from '../../services/relatorio-api.service';

const CORES_GRAFICO = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
];

function diasAtras(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString().slice(0, 10);
}

export function RelatoriosPage() {
  const [inicio, setInicio] = useState(diasAtras(30));
  const [fim, setFim] = useState(new Date().toISOString().slice(0, 10));

  const periodo = {
    inicio: new Date(`${inicio}T00:00:00`).toISOString(),
    fim: new Date(`${fim}T23:59:59`).toISOString(),
  };

  const atendimentos = useQuery({
    queryKey: ['relatorios', 'atendimentos', periodo],
    queryFn: () => relatorioApiService.atendimentos(periodo),
  });
  const faltas = useQuery({
    queryKey: ['relatorios', 'faltas', periodo],
    queryFn: () => relatorioApiService.faltas(periodo),
  });
  const novosPacientes = useQuery({
    queryKey: ['relatorios', 'novos-pacientes', periodo],
    queryFn: () => relatorioApiService.novosPacientes(periodo),
  });
  const produtividade = useQuery({
    queryKey: ['relatorios', 'produtividade', periodo],
    queryFn: () => relatorioApiService.produtividade(periodo),
  });

  const colunas: ColunaTabela<ProdutividadeItem>[] = [
    {
      chave: 'profissional',
      titulo: 'Profissional',
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{item.profissionalNome}</p>
          <p className="truncate text-xs text-muted-foreground">{item.especialidade}</p>
        </div>
      ),
    },
    { chave: 'agendados', titulo: 'Agendados', render: (item) => item.agendados },
    { chave: 'finalizados', titulo: 'Finalizados', render: (item) => item.finalizados },
    { chave: 'faltas', titulo: 'Faltas', render: (item) => item.faltas },
    {
      chave: 'taxa',
      titulo: 'Comparecimento',
      render: (item) => `${item.taxaComparecimento}%`,
    },
  ];

  return (
    <PageContainer>
      <PageTitle
        titulo="Relatórios"
        descricao="Indicadores operacionais da rede no período selecionado."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:max-w-xl">
          <FormField rotulo="Início">
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </FormField>
          <FormField rotulo="Fim">
            <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Atendimentos no período" valor={atendimentos.data?.total ?? 0} />
        <StatCard
          titulo="Faltas"
          valor={faltas.data?.faltas ?? 0}
          descricao={`${faltas.data?.taxaFaltas ?? 0}% do total`}
        />
        <StatCard
          titulo="Cancelamentos"
          valor={faltas.data?.cancelados ?? 0}
          descricao={`${faltas.data?.taxaCancelamentos ?? 0}% do total`}
        />
        <StatCard
          titulo="Novos pacientes"
          valor={(novosPacientes.data ?? []).reduce((soma, ponto) => soma + ponto.total, 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atendimentos por dia</CardTitle>
          <CardDescription>Volume diário de agendamentos no período.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {atendimentos.isLoading ? (
            <LoadingSkeleton linhas={3} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={atendimentos.data?.serie ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="rotulo" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Atendimentos"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por tipo de atendimento</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={atendimentos.data?.porTipo ?? []}
                  dataKey="total"
                  nameKey="rotulo"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {(atendimentos.data?.porTipo ?? []).map((item, indice) => (
                    <Cell key={item.rotulo} fill={CORES_GRAFICO[indice % CORES_GRAFICO.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por especialidade</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atendimentos.data?.porEspecialidade ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="rotulo" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novos pacientes por mês</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={novosPacientes.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="rotulo" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip />
              <Bar dataKey="total" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtividade por profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            colunas={colunas}
            itens={produtividade.data ?? []}
            chaveDoItem={(item) => item.profissionalId}
            carregando={produtividade.isLoading}
            mensagemVazia="Sem dados no período"
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
