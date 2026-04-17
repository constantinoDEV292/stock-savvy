import { useState, useMemo } from 'react';
import { useStock } from '@/contexts/StockContext';
import {
  Package, ArrowDownRight, ArrowUpRight, AlertTriangle, TrendingUp, TrendingDown,
  BarChart3, Clock, RefreshCw, Activity, Boxes, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import {
  format, subDays, startOfDay, isToday, isAfter, eachDayOfInterval,
} from 'date-fns';
import { pt } from 'date-fns/locale';

type TimeFilter = 'today' | '7d' | '30d' | 'year';

export default function Dashboard() {
  const { produtos, movimentacoes, produtosStockBaixo, loading } = useStock();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');

  const produtosAtivos = produtos.filter((p) => p.ativo);
  const movHoje = movimentacoes.filter((m) => isToday(new Date(m.created_at)));
  const totalItens = produtosAtivos.reduce((s, p) => s + p.quantidade, 0);

  const filterStart = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'today': return startOfDay(now);
      case '7d': return startOfDay(subDays(now, 7));
      case '30d': return startOfDay(subDays(now, 30));
      case 'year': return startOfDay(subDays(now, 365));
    }
  }, [timeFilter]);

  const previousStart = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'today': return startOfDay(subDays(now, 1));
      case '7d': return startOfDay(subDays(now, 14));
      case '30d': return startOfDay(subDays(now, 60));
      case 'year': return startOfDay(subDays(now, 730));
    }
  }, [timeFilter]);

  const filteredMov = useMemo(
    () => movimentacoes.filter((m) => isAfter(new Date(m.created_at), filterStart)),
    [movimentacoes, filterStart],
  );

  const previousMov = useMemo(
    () => movimentacoes.filter((m) => {
      const d = new Date(m.created_at);
      return isAfter(d, previousStart) && !isAfter(d, filterStart);
    }),
    [movimentacoes, previousStart, filterStart],
  );

  // ===== Trends =====
  const saidasAtual = filteredMov.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0);
  const saidasAnterior = previousMov.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0);
  const trendSaidas = saidasAnterior > 0 ? Math.round(((saidasAtual - saidasAnterior) / saidasAnterior) * 100) : 0;

  const movAtual = filteredMov.length;
  const movAnterior = previousMov.length;
  const trendMov = movAnterior > 0 ? Math.round(((movAtual - movAnterior) / movAnterior) * 100) : 0;

  // ===== Daily series for sparkline =====
  const dailySeries = useMemo(() => {
    const days = timeFilter === 'today' ? 1 : timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 30;
    const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
    return interval.map(d => {
      const dayStart = startOfDay(d);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const movs = movimentacoes.filter(m => {
        const md = new Date(m.created_at);
        return md >= dayStart && md < dayEnd;
      });
      return {
        dia: format(d, 'dd/MM', { locale: pt }),
        saidas: movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0),
        entradas: movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0),
      };
    });
  }, [movimentacoes, timeFilter]);

  // ===== Top 5 produtos =====
  const topProducts = useMemo(() => {
    const saidas = filteredMov.filter((m) => m.tipo === 'saida');
    const totals: Record<string, { nome: string; qtd: number }> = {};
    saidas.forEach((m) => {
      const prod = produtos.find((p) => p.id === m.produto_id);
      const nome = prod?.nome ?? 'Desconhecido';
      if (!totals[m.produto_id]) totals[m.produto_id] = { nome, qtd: 0 };
      totals[m.produto_id].qtd += m.quantidade;
    });
    return Object.values(totals).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  }, [filteredMov, produtos]);

  // ===== Stock health gauge =====
  const stockHealth = useMemo(() => {
    const total = produtosAtivos.length || 1;
    const ok = produtosAtivos.filter(p => p.quantidade > p.quantidade_minima).length;
    const pct = Math.round((ok / total) * 100);
    return [{ name: 'Saúde', value: pct, fill: pct > 75 ? 'hsl(140 55% 28%)' : pct > 50 ? 'hsl(45 95% 55%)' : 'hsl(0 75% 50%)' }];
  }, [produtosAtivos]);

  const produtoNomes = Object.fromEntries(produtos.map((p) => [p.id, p.nome]));

  const filterButtons: { label: string; value: TimeFilter }[] = [
    { label: 'Hoje', value: 'today' },
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: 'Ano', value: 'year' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin text-primary" />
        <p className="text-muted-foreground">A carregar dashboard...</p>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    fontSize: 12,
    boxShadow: '0 8px 24px -8px hsl(140 30% 12% / 0.15)',
  };

  const kpis = [
    {
      label: 'Produtos Ativos', value: produtosAtivos.length, icon: Boxes,
      bg: 'from-primary/10 to-primary/5', iconBg: 'bg-primary/15 text-primary',
      sub: `${produtos.length - produtosAtivos.length} inativos`, trend: null as number | null,
    },
    {
      label: 'Stock Crítico', value: produtosStockBaixo.length, icon: AlertTriangle,
      bg: 'from-destructive/10 to-destructive/5', iconBg: 'bg-destructive/15 text-destructive',
      sub: 'Abaixo do mínimo', trend: null,
    },
    {
      label: 'Mov. no Período', value: movAtual, icon: Activity,
      bg: 'from-accent/15 to-accent/5', iconBg: 'bg-accent/25 text-accent-foreground',
      sub: `${movHoje.length} hoje`, trend: trendMov,
    },
    {
      label: 'Saídas (un.)', value: saidasAtual.toLocaleString('pt-PT'), icon: TrendingDown,
      bg: 'from-warning/10 to-warning/5', iconBg: 'bg-warning/15 text-warning',
      sub: 'Consumo total', trend: trendSaidas,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Painel em tempo real
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Visão geral do stock e movimentações da fábrica</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-muted-foreground">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
          </span>
        </div>
      </div>

      {/* Time filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Período:</span>
        {filterButtons.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={timeFilter === f.value ? 'default' : 'outline'}
            className={`h-7 rounded-full px-3 text-xs shrink-0 ${timeFilter === f.value ? 'bg-gradient-primary' : ''}`}
            onClick={() => setTimeFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* KPI Cards with trends */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`relative overflow-hidden border bg-gradient-to-br ${kpi.bg} shadow-soft hover:shadow-md transition-all`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                {kpi.trend !== null && (
                  <Badge variant="outline" className={`gap-1 text-[10px] font-mono ${kpi.trend >= 0 ? 'text-success border-success/40' : 'text-destructive border-destructive/40'}`}>
                    {kpi.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(kpi.trend)}%
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hero chart — entradas vs saídas */}
      <Card className="border shadow-soft">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-primary" />
              Fluxo de Stock — Entradas vs Saídas
            </CardTitle>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Entradas</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Saídas</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72">
            {dailySeries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries}>
                  <defs>
                    <linearGradient id="dashGradSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(140 55% 28%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(140 55% 28%)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashGradEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45 95% 55%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(45 95% 55%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="entradas" stroke="hsl(45 95% 55%)" strokeWidth={2.5} fill="url(#dashGradEntradas)" name="Entradas" />
                  <Area type="monotone" dataKey="saidas" stroke="hsl(140 55% 28%)" strokeWidth={2.5} fill="url(#dashGradSaidas)" name="Saídas" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts row — Top 5 + Stock health gauge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border shadow-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-accent-foreground" />
              Top 5 — Mais Retirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {topProducts.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} un.`, 'Saídas']} />
                    <Bar dataKey="qtd" fill="hsl(45 95% 55%)" radius={[0, 8, 8, 0]} name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-primary" />
              Saúde Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={stockHealth} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={12} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-bold tracking-tight" style={{ color: stockHealth[0].fill }}>
                  {stockHealth[0].value}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock saudável</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-base font-bold">{totalItens.toLocaleString('pt-PT')}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Itens totais</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-base font-bold text-destructive">{produtosStockBaixo.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert */}
      <Card className="border shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Produtos com Stock Crítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {produtosStockBaixo.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Package className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-medium">Tudo em ordem</p>
              <p className="text-xs text-muted-foreground">Nenhum produto abaixo do mínimo</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {produtosStockBaixo.map((p) => (
                  <div key={p.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.nome}</span>
                      <Badge variant="destructive" className="text-[10px]">Crítico</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{p.codigo}</span>
                      <span>Atual: <span className="font-mono font-semibold text-destructive">{p.quantidade}</span> / Mín: <span className="font-mono">{p.quantidade_minima}</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4">Produto</th>
                      <th className="pb-2 pr-4">Código</th>
                      <th className="pb-2 pr-4 text-right">Qtd. Atual</th>
                      <th className="pb-2 pr-4 text-right">Mínimo</th>
                      <th className="pb-2 pr-4 w-32">Nível</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosStockBaixo.map((p) => {
                      const pct = Math.min(100, (p.quantidade / Math.max(p.quantidade_minima, 1)) * 100);
                      return (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 pr-4 font-medium">{p.nome}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{p.codigo}</td>
                          <td className="py-2.5 pr-4 text-right font-mono font-bold text-destructive">{p.quantidade}</td>
                          <td className="py-2.5 pr-4 text-right font-mono">{p.quantidade_minima}</td>
                          <td className="py-2.5 pr-4">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-destructive transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="py-2.5 text-center"><Badge variant="destructive" className="animate-pulse-warning text-[10px]">Crítico</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Latest movements */}
      <Card className="border shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Últimas Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação registada</p>
          ) : (
            <>
              <div className="space-y-2 sm:hidden">
                {movimentacoes.slice(0, 8).map((m) => (
                  <div key={m.id} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{produtoNomes[m.produto_id] ?? '—'}</span>
                      <Badge className={m.tipo === 'entrada' ? 'bg-accent/20 text-accent-foreground border-0 text-[10px]' : 'bg-primary/15 text-primary border-0 text-[10px]'}>
                        {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{format(new Date(m.created_at), 'dd/MM HH:mm', { locale: pt })}</span>
                      <span>Qtd: <span className="font-mono font-semibold text-foreground">{m.quantidade}</span></span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{m.responsavel} · {m.departamento}</div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-4">Data / Hora</th>
                      <th className="pb-2 pr-4">Produto</th>
                      <th className="pb-2 pr-4">Tipo</th>
                      <th className="pb-2 pr-4 text-right">Qtd</th>
                      <th className="pb-2 pr-4">Responsável</th>
                      <th className="pb-2">Departamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoes.slice(0, 10).map((m) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: pt })}</td>
                        <td className="py-2.5 pr-4 font-medium">{produtoNomes[m.produto_id] ?? '—'}</td>
                        <td className="py-2.5 pr-4">
                          <Badge className={m.tipo === 'entrada' ? 'bg-accent/20 text-accent-foreground border-0' : 'bg-primary/15 text-primary border-0'}>
                            {m.tipo === 'entrada' ? <><ArrowUpRight className="mr-1 h-3 w-3" />Entrada</> : <><ArrowDownRight className="mr-1 h-3 w-3" />Saída</>}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono font-semibold">{m.quantidade}</td>
                        <td className="py-2.5 pr-4">{m.responsavel}</td>
                        <td className="py-2.5 text-muted-foreground">{m.departamento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
