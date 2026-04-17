import { useState, useMemo } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Building2, Layers, FileDown,
  Calendar, ArrowUpRight, ArrowDownRight, Activity, Award, AlertTriangle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, isWithinInterval, startOfDay, subDays, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Period = '30d' | '90d' | '6m' | '12m';

const COLORS = [
  'hsl(140 55% 28%)', // verde
  'hsl(45 95% 55%)',  // amarelo milho
  'hsl(140 50% 42%)', // verde claro
  'hsl(38 95% 50%)',  // laranja
  'hsl(140 35% 55%)', // sage
  'hsl(45 70% 70%)',  // creme
  'hsl(140 25% 35%)', // verde escuro
  'hsl(20 80% 55%)',  // âmbar
];

export default function Relatorios() {
  const { produtos, movimentacoes } = useStock();
  const [period, setPeriod] = useState<Period>('90d');

  const periodStart = useMemo(() => {
    const now = new Date();
    switch (period) {
      case '30d': return startOfDay(subDays(now, 30));
      case '90d': return startOfDay(subDays(now, 90));
      case '6m': return startOfMonth(subMonths(now, 6));
      case '12m': return startOfMonth(subMonths(now, 12));
    }
  }, [period]);

  const movFiltered = useMemo(
    () => movimentacoes.filter(m => isAfter(new Date(m.created_at), periodStart)),
    [movimentacoes, periodStart],
  );

  const produtoMap = useMemo(
    () => Object.fromEntries(produtos.map(p => [p.id, p])),
    [produtos],
  );

  // ===== KPIs =====
  const totalSaidas = movFiltered.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0);
  const totalEntradas = movFiltered.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0);
  const totalMovimentos = movFiltered.length;
  const taxaRotacao = produtos.length > 0
    ? ((totalSaidas / produtos.reduce((s, p) => s + Math.max(p.quantidade, 1), 0)) * 100).toFixed(1)
    : '0.0';

  // ===== Consumo por Departamento =====
  const consumoPorDepartamento = useMemo(() => {
    const map: Record<string, { departamento: string; saidas: number; entradas: number; total: number }> = {};
    movFiltered.forEach(m => {
      const k = m.departamento || 'Sem dept.';
      if (!map[k]) map[k] = { departamento: k, saidas: 0, entradas: 0, total: 0 };
      if (m.tipo === 'saida') map[k].saidas += m.quantidade;
      else map[k].entradas += m.quantidade;
      map[k].total += m.quantidade;
    });
    return Object.values(map).sort((a, b) => b.saidas - a.saidas).slice(0, 10);
  }, [movFiltered]);

  // ===== Top Categorias =====
  const topCategorias = useMemo(() => {
    const map: Record<string, number> = {};
    movFiltered.filter(m => m.tipo === 'saida').forEach(m => {
      const cat = produtoMap[m.produto_id]?.categoria ?? 'Outros';
      map[cat] = (map[cat] || 0) + m.quantidade;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [movFiltered, produtoMap]);

  // ===== Evolução Mensal =====
  const evolucaoMensal = useMemo(() => {
    const months = eachMonthOfInterval({
      start: period === '12m' ? subMonths(new Date(), 11) : period === '6m' ? subMonths(new Date(), 5) : subMonths(new Date(), 2),
      end: new Date(),
    });
    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const movsMes = movimentacoes.filter(mv => {
        const d = new Date(mv.created_at);
        return isWithinInterval(d, { start, end });
      });
      return {
        mes: format(m, 'MMM/yy', { locale: pt }),
        saidas: movsMes.filter(mv => mv.tipo === 'saida').reduce((s, mv) => s + mv.quantidade, 0),
        entradas: movsMes.filter(mv => mv.tipo === 'entrada').reduce((s, mv) => s + mv.quantidade, 0),
        movimentos: movsMes.length,
      };
    });
  }, [movimentacoes, period]);

  // ===== Top Produtos =====
  const topProdutos = useMemo(() => {
    const map: Record<string, { nome: string; codigo: string; categoria: string; saidas: number }> = {};
    movFiltered.filter(m => m.tipo === 'saida').forEach(m => {
      const p = produtoMap[m.produto_id];
      if (!p) return;
      if (!map[p.id]) map[p.id] = { nome: p.nome, codigo: p.codigo, categoria: p.categoria, saidas: 0 };
      map[p.id].saidas += m.quantidade;
    });
    return Object.values(map).sort((a, b) => b.saidas - a.saidas).slice(0, 10);
  }, [movFiltered, produtoMap]);

  // ===== Distribuição por Motivo =====
  const motivosData = useMemo(() => {
    const map: Record<string, number> = {};
    movFiltered.filter(m => m.tipo === 'saida').forEach(m => {
      const k = m.motivo || 'Não especificado';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [movFiltered]);

  // ===== Saúde do stock =====
  const saudeStock = useMemo(() => {
    const ativos = produtos.filter(p => p.ativo);
    const ok = ativos.filter(p => p.quantidade > p.quantidade_minima * 1.5).length;
    const baixo = ativos.filter(p => p.quantidade <= p.quantidade_minima * 1.5 && p.quantidade > p.quantidade_minima).length;
    const critico = ativos.filter(p => p.quantidade <= p.quantidade_minima).length;
    return [
      { name: 'Saudável', value: ok, fill: 'hsl(140 55% 28%)' },
      { name: 'Atenção', value: baixo, fill: 'hsl(45 95% 55%)' },
      { name: 'Crítico', value: critico, fill: 'hsl(0 75% 50%)' },
    ];
  }, [produtos]);

  const periodLabels: Record<Period, string> = {
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '6m': 'Últimos 6 meses',
    '12m': 'Últimos 12 meses',
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(20);
    doc.setTextColor(42, 100, 50);
    doc.text('KiandaStock — Relatório Executivo', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${periodLabels[period]}  ·  Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 25);

    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Indicadores Globais', 14, 35);
    autoTable(doc, {
      startY: 38,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total de movimentações', totalMovimentos.toString()],
        ['Total de saídas (un.)', totalSaidas.toString()],
        ['Total de entradas (un.)', totalEntradas.toString()],
        ['Taxa de rotação', `${taxaRotacao}%`],
        ['Produtos em stock crítico', saudeStock[2].value.toString()],
      ],
      headStyles: { fillColor: [42, 100, 50] },
      styles: { fontSize: 9 },
    });

    doc.text('Top Departamentos por Consumo', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 13,
      head: [['Departamento', 'Saídas', 'Entradas', 'Total']],
      body: consumoPorDepartamento.map(d => [d.departamento, d.saidas, d.entradas, d.total]),
      headStyles: { fillColor: [42, 100, 50] },
      styles: { fontSize: 9 },
    });

    doc.text('Top 10 Produtos Mais Consumidos', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 13,
      head: [['#', 'Código', 'Produto', 'Categoria', 'Saídas']],
      body: topProdutos.map((p, i) => [i + 1, p.codigo, p.nome, p.categoria, p.saidas]),
      headStyles: { fillColor: [42, 100, 50] },
      styles: { fontSize: 9 },
    });

    doc.save(`relatorio-executivo-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    fontSize: 12,
    boxShadow: '0 8px 24px -8px hsl(140 30% 12% / 0.15)',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <Activity className="h-3 w-3" />
            Análise estratégica
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios Executivos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Visão analítica e comparativa para tomada de decisão</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['30d', '90d', '6m', '12m'] as Period[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
              className="h-8 text-xs"
            >
              {periodLabels[p]}
            </Button>
          ))}
          <Button size="sm" onClick={exportPDF} className="h-8 bg-gradient-primary text-xs">
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Saídas totais', value: totalSaidas.toLocaleString('pt-PT'), icon: ArrowDownRight, trend: '+12%', color: 'text-primary', bg: 'from-primary/10 to-primary/5', iconBg: 'bg-primary/15 text-primary' },
          { label: 'Entradas totais', value: totalEntradas.toLocaleString('pt-PT'), icon: ArrowUpRight, trend: '+8%', color: 'text-success', bg: 'from-success/10 to-success/5', iconBg: 'bg-success/15 text-success' },
          { label: 'Movimentos', value: totalMovimentos.toLocaleString('pt-PT'), icon: Activity, trend: 'Período', color: 'text-accent-foreground', bg: 'from-accent/15 to-accent/5', iconBg: 'bg-accent/25 text-accent-foreground' },
          { label: 'Taxa de rotação', value: `${taxaRotacao}%`, icon: TrendingUp, trend: 'Stock', color: 'text-warning', bg: 'from-warning/10 to-warning/5', iconBg: 'bg-warning/15 text-warning' },
        ].map(kpi => (
          <Card key={kpi.label} className={`relative overflow-hidden border bg-gradient-to-br ${kpi.bg} shadow-soft hover:shadow-md transition-all`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">{kpi.trend}</Badge>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evolução Mensal — destaque */}
      <Card className="border shadow-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-primary" />
              Evolução Mensal — Entradas vs Saídas
            </CardTitle>
            <Badge variant="secondary" className="text-[10px]">{periodLabels[period]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {evolucaoMensal.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolucaoMensal}>
                  <defs>
                    <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(140 55% 28%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(140 55% 28%)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45 95% 55%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(45 95% 55%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="entradas" stroke="hsl(45 95% 55%)" strokeWidth={2} fill="url(#gradEntradas)" name="Entradas" />
                  <Area type="monotone" dataKey="saidas" stroke="hsl(140 55% 28%)" strokeWidth={2} fill="url(#gradSaidas)" name="Saídas" />
                  <Line type="monotone" dataKey="movimentos" stroke="hsl(38 95% 50%)" strokeWidth={2} dot={{ r: 3 }} name="Nº Movimentos" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Departamentos + Categorias */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border shadow-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Consumo por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {consumoPorDepartamento.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consumoPorDepartamento} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="departamento" width={110} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="saidas" fill="hsl(140 55% 28%)" radius={[0, 6, 6, 0]} name="Saídas" />
                    <Bar dataKey="entradas" fill="hsl(45 95% 55%)" radius={[0, 6, 6, 0]} name="Entradas" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-accent-foreground" />
              Top Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {topCategorias.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCategorias}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      label={(entry: any) => `${entry.value}`}
                      labelLine={false}
                      style={{ fontSize: 11 }}
                    >
                      {topCategorias.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saúde do Stock + Motivos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Saúde do Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="95%" data={saudeStock} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={8} />
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {saudeStock.map(s => (
                <div key={s.name}>
                  <p className="text-xl font-bold" style={{ color: s.fill }}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Award className="h-4 w-4 text-accent-foreground" />
              Distribuição por Motivo de Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {motivosData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={motivosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Ocorrências">
                      {motivosData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Produtos */}
      <Card className="border shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" />
            Top 10 Produtos Mais Consumidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Saídas</th>
                  <th className="px-4 py-3 w-48">Distribuição</th>
                </tr>
              </thead>
              <tbody>
                {topProdutos.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sem dados de consumo</td></tr>
                )}
                {topProdutos.map((p, i) => {
                  const max = topProdutos[0]?.saidas || 1;
                  const pct = (p.saidas / max) * 100;
                  return (
                    <tr key={p.codigo} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i < 3 ? 'bg-gradient-corn text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.codigo}</td>
                      <td className="px-4 py-3 font-medium">{p.nome}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{p.categoria}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{p.saidas.toLocaleString('pt-PT')}</td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-corn" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
