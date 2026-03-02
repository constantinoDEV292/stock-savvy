import { useStock } from '@/contexts/StockContext';
import { Package, ArrowDownRight, ArrowUpRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { produtos, movimentacoes, produtosStockBaixo, totalItens, loading } = useStock();

  const produtosAtivos = produtos.filter(p => p.ativo);
  const entradas = movimentacoes.filter(m => m.tipo === 'entrada');
  const saidas = movimentacoes.filter(m => m.tipo === 'saida');

  const chartData = [
    { mes: 'Mar', entradas: entradas.length, saidas: saidas.length },
  ];

  const kpis = [
    { label: 'Produtos Cadastrados', value: produtosAtivos.length, icon: Package, color: 'text-primary' },
    { label: 'Total em Stock', value: totalItens, icon: TrendingUp, color: 'text-success' },
    { label: 'Entradas (mês)', value: entradas.length, icon: ArrowUpRight, color: 'text-success' },
    { label: 'Saídas (mês)', value: saidas.length, icon: ArrowDownRight, color: 'text-warning' },
  ];

  // Build a lookup for product names
  const produtoNomes = Object.fromEntries(produtos.map(p => [p.id, p.nome]));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">A carregar...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do stock da fábrica</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="industrial-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-muted ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="industrial-shadow lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Movimentações Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saidas" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="industrial-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Stock Baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {produtosStockBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta</p>
            ) : (
              produtosStockBaixo.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">{p.quantidade}/{p.quantidade_minima}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="industrial-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Produto</th>
                  <th className="pb-2 pr-4">Tipo</th>
                  <th className="pb-2 pr-4">Qtd</th>
                  <th className="pb-2 pr-4">Responsável</th>
                  <th className="pb-2 pr-4">Dept.</th>
                  <th className="pb-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.slice(0, 8).map(m => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{produtoNomes[m.produto_id] ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={m.tipo === 'entrada' ? 'default' : 'secondary'} className={m.tipo === 'entrada' ? 'bg-success text-success-foreground' : 'bg-warning/15 text-warning'}>
                        {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{m.quantidade}</td>
                    <td className="py-2.5 pr-4">{m.responsavel}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{m.departamento}</td>
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
                {movimentacoes.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma movimentação registada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
