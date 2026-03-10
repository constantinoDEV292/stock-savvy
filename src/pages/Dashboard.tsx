import { useState, useMemo } from 'react';
import { useStock } from '@/contexts/StockContext';
import {
  Package,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, isToday, isAfter } from 'date-fns';
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

  const filteredMov = useMemo(
    () => movimentacoes.filter((m) => isAfter(new Date(m.created_at), filterStart)),
    [movimentacoes, filterStart],
  );

  const consumptionData = useMemo(() => {
    const saidas = filteredMov.filter((m) => m.tipo === 'saida');
    const buckets: Record<string, number> = {};
    saidas.forEach((m) => {
      const key = format(new Date(m.created_at), 'dd/MM', { locale: pt });
      buckets[key] = (buckets[key] || 0) + m.quantidade;
    });
    return Object.entries(buckets).map(([dia, qtd]) => ({ dia, qtd })).slice(-15);
  }, [filteredMov]);

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

  const produtoNomes = Object.fromEntries(produtos.map((p) => [p.id, p.nome]));

  const filterButtons: { label: string; value: TimeFilter }[] = [
    { label: 'Hoje', value: 'today' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
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

  const kpis = [
    { label: 'Total de Produtos', value: produtosAtivos.length, icon: Package, gradient: 'from-primary/10 to-primary/5', iconBg: 'bg-primary/15 text-primary', desc: 'Produtos cadastrados' },
    { label: 'Stock Baixo', value: produtosStockBaixo.length, icon: AlertTriangle, gradient: 'from-destructive/10 to-destructive/5', iconBg: 'bg-destructive/15 text-destructive', desc: 'Abaixo do mínimo' },
    { label: 'Mov. Hoje', value: movHoje.length, icon: Clock, gradient: 'from-warning/10 to-warning/5', iconBg: 'bg-warning/15 text-warning', desc: 'Entradas e saídas' },
    { label: 'Itens em Stock', value: totalItens.toLocaleString('pt-PT'), icon: BarChart3, gradient: 'from-success/10 to-success/5', iconBg: 'bg-success/15 text-success', desc: 'Unidades totais' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Visão geral do stock</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`relative overflow-hidden border-0 bg-gradient-to-br ${kpi.gradient} shadow-sm`}>
            <CardContent className="flex items-center gap-3 p-3 sm:p-5">
              <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="truncate text-[10px] sm:text-xs font-medium text-muted-foreground">{kpi.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time filter */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground shrink-0">Período:</span>
        {filterButtons.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={timeFilter === f.value ? 'default' : 'outline'}
            className="h-7 rounded-full px-2.5 sm:px-3 text-[10px] sm:text-xs shrink-0"
            onClick={() => setTimeFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        <Card className="border shadow-sm lg:col-span-3">
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-primary" />
              Consumo de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="h-48 sm:h-64">
              {consumptionData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs sm:text-sm text-muted-foreground">Sem dados de saída neste período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consumptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={30} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} formatter={(v: number) => [`${v} un.`, 'Saídas']} />
                    <Line type="monotone" dataKey="qtd" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2, fill: 'hsl(var(--primary))' }} activeDot={{ r: 4 }} name="Saídas" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-warning" />
              Top 5 Mais Retirados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="h-48 sm:h-64">
              {topProducts.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs sm:text-sm text-muted-foreground">Sem dados neste período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="nome" width={80} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} formatter={(v: number) => [`${v} un.`, 'Retirado']} />
                    <Bar dataKey="qtd" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock — mobile card view, desktop table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-3 sm:p-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Produtos com Stock Baixo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {produtosStockBaixo.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">✅ Todos os produtos acima do stock mínimo</p>
          ) : (
            <>
              {/* Mobile card list */}
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
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th className="pb-2 pr-4">Produto</th>
                      <th className="pb-2 pr-4">Código</th>
                      <th className="pb-2 pr-4 text-right">Qtd. Atual</th>
                      <th className="pb-2 pr-4 text-right">Mínimo</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosStockBaixo.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pr-4 font-medium">{p.nome}</td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{p.codigo}</td>
                        <td className="py-2.5 pr-4 text-right font-mono font-semibold text-destructive">{p.quantidade}</td>
                        <td className="py-2.5 pr-4 text-right font-mono">{p.quantidade_minima}</td>
                        <td className="py-2.5 text-center"><Badge variant="destructive" className="text-[10px]">Crítico</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Latest movements — mobile card view, desktop table */}
      <Card className="border shadow-sm">
        <CardHeader className="p-3 sm:p-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Últimas Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {movimentacoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação registada</p>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-2 sm:hidden">
                {movimentacoes.slice(0, 10).map((m) => (
                  <div key={m.id} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{produtoNomes[m.produto_id] ?? '—'}</span>
                      <Badge variant={m.tipo === 'entrada' ? 'default' : 'secondary'} className={m.tipo === 'entrada' ? 'bg-success/15 text-success border-0 text-[10px]' : 'bg-warning/15 text-warning border-0 text-[10px]'}>
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
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th className="pb-2 pr-4">Data / Hora</th>
                      <th className="pb-2 pr-4">Produto</th>
                      <th className="pb-2 pr-4">Tipo</th>
                      <th className="pb-2 pr-4 text-right">Qtd</th>
                      <th className="pb-2 pr-4">Responsável</th>
                      <th className="pb-2">Dept.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoes.slice(0, 10).map((m) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: pt })}</td>
                        <td className="py-2.5 pr-4 font-medium">{produtoNomes[m.produto_id] ?? '—'}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={m.tipo === 'entrada' ? 'default' : 'secondary'} className={m.tipo === 'entrada' ? 'bg-success/15 text-success border-0' : 'bg-warning/15 text-warning border-0'}>
                            {m.tipo === 'entrada' ? <><ArrowUpRight className="mr-1 h-3 w-3" />Entrada</> : <><ArrowDownRight className="mr-1 h-3 w-3" />Saída</>}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono">{m.quantidade}</td>
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
