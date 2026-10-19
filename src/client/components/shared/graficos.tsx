'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatarNumero } from '@/client/lib/format';

const EIXO = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } as const;

export type SerieBarra = {
  rotulo: string;
  valores: { chave: string; valor: number; cor?: string }[];
};

export type PontoGrafico = { rotulo: string; valor: number; cor?: string };

/** Barras verticais — usadas em produtividade e atendimentos por período. */
export function GraficoBarras({
  dados,
  chaveValor,
  cor = 'hsl(var(--primary))',
  altura = 260,
}: {
  dados: PontoGrafico[];
  chaveValor: string;
  cor?: string;
  altura?: number;
}) {
  const formatados = dados.map((item) => ({ rotulo: item.rotulo, [chaveValor]: item.valor }));

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={formatados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="rotulo" tick={EIXO} interval={0} angle={dados.length > 6 ? -25 : 0} textAnchor={dados.length > 6 ? 'end' : 'middle'} height={dados.length > 6 ? 60 : 30} />
        <YAxis tick={EIXO} allowDecimals={false} />
        <Tooltip
          formatter={(valor: number) => formatarNumero(valor)}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: 12,
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Bar dataKey={chaveValor} fill={cor} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Linha temporal — evolução de atendimentos. */
export function GraficoLinha({
  dados,
  chaveValor,
  cor = 'hsl(var(--primary))',
  altura = 260,
}: {
  dados: PontoGrafico[];
  chaveValor: string;
  cor?: string;
  altura?: number;
}) {
  const formatados = dados.map((item) => ({ rotulo: item.rotulo, [chaveValor]: item.valor }));

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={formatados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="rotulo" tick={EIXO} />
        <YAxis tick={EIXO} allowDecimals={false} />
        <Tooltip
          formatter={(valor: number) => formatarNumero(valor)}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey={chaveValor} stroke={cor} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Pizza/rosca — distribuição por tipo de atendimento ou especialidade. */
export function GraficoPizza({ dados, altura = 280 }: { dados: PontoGrafico[]; altura?: number }) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <PieChart>
        <Pie data={dados} dataKey="valor" nameKey="rotulo" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
          {dados.map((item, indice) => (
            <Cell key={`fatia-${indice}`} fill={item.cor ?? `hsl(var(--primary))`} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(valor) => <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{valor}</span>}
        />
        <Tooltip
          formatter={(valor: number) => formatarNumero(valor)}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
