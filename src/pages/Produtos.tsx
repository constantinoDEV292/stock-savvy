import { useState } from 'react';
import { useStock } from '@/contexts/StockContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Produto = Tables<'produtos'>;

const categorias = ['Equipamento', 'Material', 'Peça'];
const localizacoes = ['Armazém A', 'Armazém B', 'Armazém C'];

function ProdutoForm({ produto, onSave, onClose }: { produto?: Produto; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    categoria: produto?.categoria || 'Material',
    codigo: produto?.codigo || '',
    quantidade: produto?.quantidade ?? 0,
    quantidade_minima: produto?.quantidade_minima ?? 5,
    localizacao: produto?.localizacao || 'Armazém A',
    observacoes: produto?.observacoes || '',
    ativo: produto?.ativo ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.codigo.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Nome do Produto</Label>
          <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
        </div>
        <div>
          <Label>Código Interno</Label>
          <Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} required />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Quantidade</Label>
          <Input type="number" min={0} value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>Quantidade Mínima</Label>
          <Input type="number" min={0} value={form.quantidade_minima} onChange={e => setForm(p => ({ ...p, quantidade_minima: Number(e.target.value) }))} />
        </div>
        <div>
          <Label>Localização</Label>
          <Select value={form.localizacao} onValueChange={v => setForm(p => ({ ...p, localizacao: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{localizacoes.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Observações</Label>
          <Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}

export default function Produtos() {
  const { produtos, addProduto, updateProduto } = useStock();
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduto, setEditProduto] = useState<Produto | undefined>();
  const { toast } = useToast();

  const isAdmin = role === 'admin';

  const filtered = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (data: any) => {
    try {
      if (editProduto) {
        await updateProduto(editProduto.id, data);
        toast({ title: 'Produto atualizado com sucesso' });
      } else {
        await addProduto(data);
        toast({ title: 'Produto cadastrado com sucesso' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setEditProduto(undefined);
  };

  const openEdit = (p: Produto) => {
    setEditProduto(p);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditProduto(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gestão de equipamentos e materiais</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              </DialogHeader>
              <ProdutoForm produto={editProduto} onSave={handleSave} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar por nome ou código..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="industrial-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Mínimo</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3">Estado</th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const lowStock = p.ativo && p.quantidade <= p.quantidade_minima;
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                      <td className="px-4 py-3 font-medium">{p.nome}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{p.categoria}</Badge></td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-semibold ${lowStock ? 'text-destructive' : ''}`}>{p.quantidade}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{p.quantidade_minima}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.localizacao}</td>
                      <td className="px-4 py-3">
                        {!p.ativo ? (
                          <Badge variant="secondary">Inativo</Badge>
                        ) : lowStock ? (
                          <Badge variant="destructive" className="animate-pulse-warning">Stock Baixo</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Normal</Badge>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">Nenhum produto encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
