import { useState, useMemo } from 'react';
import { useStock } from '@/contexts/StockContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, FileDown, FileSpreadsheet, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 20;

export default function Historico() {
  const { movimentacoes, produtos } = useStock();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const produtoNomes = Object.fromEntries(produtos.map(p => [p.id, p.nome]));
  const departamentos = [...new Set(movimentacoes.map(m => m.departamento))];

  const filtered = useMemo(() => {
    return movimentacoes.filter(m => {
      const nome = produtoNomes[m.produto_id] ?? '';
      const matchSearch = nome.toLowerCase().includes(search.toLowerCase()) ||
        m.responsavel.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipoFilter === 'all' || m.tipo === tipoFilter;
      const matchDept = deptFilter === 'all' || m.departamento === deptFilter;
      const mDate = new Date(m.created_at);
      const matchDateFrom = !dateFrom || mDate >= dateFrom;
      const matchDateTo = !dateTo || mDate <= new Date(dateTo.getTime() + 86400000 - 1);
      return matchSearch && matchTipo && matchDept && matchDateFrom && matchDateTo;
    });
  }, [movimentacoes, produtoNomes, search, tipoFilter, deptFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filtered.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);

  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleTipoFilter = (val: string) => { setTipoFilter(val); setCurrentPage(1); };
  const handleDeptFilter = (val: string) => { setDeptFilter(val); setCurrentPage(1); };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getExportRows = () =>
    filtered.map(m => ({
      Data: formatDate(m.created_at),
      Produto: produtoNomes[m.produto_id] ?? '—',
      Tipo: m.tipo === 'entrada' ? 'Entrada' : 'Saída',
      Quantidade: m.quantidade,
      Responsável: m.responsavel,
      Recebeu: m.responsavel_recebeu || '—',
      Departamento: m.departamento,
      Motivo: m.motivo,
    }));

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Histórico de Movimentações', 14, 18);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 25);
    const rows = getExportRows();
    autoTable(doc, {
      startY: 30,
      head: [['Data', 'Produto', 'Tipo', 'Qtd', 'Responsável', 'Recebeu', 'Departamento', 'Motivo']],
      body: rows.map(r => [r.Data, r.Produto, r.Tipo, r.Quantidade, r.Responsável, r.Recebeu, r.Departamento, r.Motivo]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save('historico-movimentacoes.pdf');
  };

  const exportXLSX = () => {
    const rows = getExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
    XLSX.writeFile(wb, 'historico-movimentacoes.xlsx');
  };

  const renderPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Histórico</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Registo completo de movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} className="flex-1 sm:flex-none">
            <FileDown className="h-4 w-4 mr-1.5" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportXLSX} className="flex-1 sm:flex-none">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
        <div className="relative sm:col-span-2 lg:flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar produto ou responsável..." className="pl-9" value={search} onChange={e => handleSearch(e.target.value)} />
        </div>
        <Select value={tipoFilter} onValueChange={handleTipoFilter}>
          <SelectTrigger className="w-full lg:w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={handleDeptFilter}>
          <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full lg:w-40 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Data início'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setCurrentPage(1); }} initialFocus className="p-3 pointer-events-auto" locale={pt} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full lg:w-40 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Data fim'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setCurrentPage(1); }} initialFocus className="p-3 pointer-events-auto" locale={pt} />
          </PopoverContent>
        </Popover>

        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="icon" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setCurrentPage(1); }} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {paginatedData.map(m => (
          <Card key={m.id} className="industrial-shadow">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{produtoNomes[m.produto_id] ?? '—'}</span>
                <Badge variant={m.tipo === 'entrada' ? 'default' : 'secondary'} className={m.tipo === 'entrada' ? 'bg-success text-success-foreground text-[10px]' : 'bg-warning/15 text-warning text-[10px]'}>
                  {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <span>Data: <span className="font-mono text-foreground">{new Date(m.created_at).toLocaleDateString('pt-PT')}</span></span>
                <span>Qtd: <span className="font-mono font-semibold text-foreground">{m.quantidade}</span></span>
                <span className="truncate">Resp: {m.responsavel}</span>
                <span className="truncate">Dept: {m.departamento}</span>
                {m.responsavel_recebeu && <span className="col-span-2 truncate">Recebeu: {m.responsavel_recebeu}</span>}
                <span className="col-span-2 truncate">Motivo: {m.motivo}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação encontrada</p>
        )}
      </div>

      {/* Desktop table */}
      <Card className="industrial-shadow hidden sm:block">
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
                  <th className="px-4 py-3">Recebeu</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(m => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{produtoNomes[m.produto_id] ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.tipo === 'entrada' ? 'default' : 'secondary'} className={m.tipo === 'entrada' ? 'bg-success text-success-foreground' : 'bg-warning/15 text-warning'}>
                        {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{m.quantidade}</td>
                    <td className="px-4 py-3">{m.responsavel}</td>
                    <td className="px-4 py-3">{m.responsavel_recebeu || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.departamento}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.motivo}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhuma movimentação encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{filtered.length} movimentação(ões) — Página {safeCurrentPage}/{totalPages}</p>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={safeCurrentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {renderPageNumbers().map(page => (
                <PaginationItem key={page}>
                  <PaginationLink isActive={page === safeCurrentPage} onClick={() => setCurrentPage(page)} className="cursor-pointer">
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={safeCurrentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
