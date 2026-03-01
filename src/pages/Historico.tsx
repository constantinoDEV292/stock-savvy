import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function Historico() {
  const { movimentacoes } = useStock();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const departamentos = [...new Set(movimentacoes.map(m => m.departamento))];

  const filtered = movimentacoes.filter(m => {
    const matchSearch = m.produto_nome.toLowerCase().includes(search.toLowerCase()) ||
      m.responsavel.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === 'all' || m.tipo === tipoFilter;
    const matchDept = deptFilter === 'all' || m.departamento === deptFilter;
    return matchSearch && matchTipo && matchDept;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-sm text-muted-foreground">Registo completo de movimentações</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar produto ou responsável..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="industrial-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.data).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium">{m.produto_nome}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.tipo === 'entrada' ? 'default' : 'secondary'} className={m.tipo === 'entrada' ? 'bg-success text-success-foreground' : 'bg-warning/15 text-warning'}>
                        {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{m.quantidade}</td>
                    <td className="px-4 py-3">{m.responsavel}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.departamento}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.motivo}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma movimentação encontrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{filtered.length} movimentação(ões) encontrada(s)</p>
    </div>
  );
}
