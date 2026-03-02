import { useState, useEffect } from 'react';
import { useStock } from '@/contexts/StockContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const motivos = ['Uso produção', 'Manutenção preventiva', 'Manutenção corretiva', 'Substituição', 'Perda', 'Reposição', 'Compra', 'Outro'];

export default function Movimentacoes() {
  const { produtos, addMovimentacao } = useStock();
  const { toast } = useToast();
  const produtosAtivos = produtos.filter(p => p.ativo);

  const [departamentos, setDepartamentos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    supabase.from('departamentos').select('id, nome').order('nome').then(({ data }) => {
      if (data) setDepartamentos(data);
    });
  }, []);

  const [saidaForm, setSaidaForm] = useState({ produto_id: '', quantidade: 1, responsavel: '', departamento: '', motivo: '', motivo_outro: '', responsavel_recebeu: '' });
  const [entradaForm, setEntradaForm] = useState({ produto_id: '', quantidade: 1, responsavel: '', departamento: '', fornecedor: '', nota: '', responsavel_recebeu: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSaida = async (e: React.FormEvent) => {
    e.preventDefault();
    const produto = produtosAtivos.find(p => p.id === saidaForm.produto_id);
    if (!produto) return;
    if (saidaForm.quantidade > produto.quantidade) {
      toast({ title: 'Erro', description: 'Quantidade maior que o stock disponível', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const motivo = saidaForm.motivo === 'Outro' ? saidaForm.motivo_outro : saidaForm.motivo;
      await addMovimentacao({
        produto_id: saidaForm.produto_id,
        tipo: 'saida',
        quantidade: saidaForm.quantidade,
        responsavel: saidaForm.responsavel,
        departamento: saidaForm.departamento,
        motivo,
        responsavel_recebeu: saidaForm.responsavel_recebeu || null,
      });
      toast({ title: '✅ Saída registada', description: `${saidaForm.quantidade}x ${produto.nome}` });
      setSaidaForm({ produto_id: '', quantidade: 1, responsavel: '', departamento: '', motivo: '', motivo_outro: '', responsavel_recebeu: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    const produto = produtosAtivos.find(p => p.id === entradaForm.produto_id);
    if (!produto) return;
    setSubmitting(true);
    try {
      await addMovimentacao({
        produto_id: entradaForm.produto_id,
        tipo: 'entrada',
        quantidade: entradaForm.quantidade,
        responsavel: entradaForm.responsavel,
        departamento: entradaForm.departamento,
        motivo: 'Reposição',
        fornecedor: entradaForm.fornecedor || null,
        nota: entradaForm.nota || null,
        responsavel_recebeu: entradaForm.responsavel_recebeu || null,
      });
      toast({ title: '✅ Entrada registada', description: `${entradaForm.quantidade}x ${produto.nome}` });
      setEntradaForm({ produto_id: '', quantidade: 1, responsavel: '', departamento: '', fornecedor: '', nota: '', responsavel_recebeu: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const selectedSaidaProduto = produtosAtivos.find(p => p.id === saidaForm.produto_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Registar entradas e saídas de material</p>
      </div>

      <Tabs defaultValue="saida" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="saida" className="flex-1 gap-2"><ArrowDownRight className="h-4 w-4" />Saída</TabsTrigger>
          <TabsTrigger value="entrada" className="flex-1 gap-2"><ArrowUpRight className="h-4 w-4" />Entrada</TabsTrigger>
        </TabsList>

        <TabsContent value="saida">
          <Card className="industrial-shadow max-w-2xl">
            <CardHeader><CardTitle className="text-lg">📤 Registo de Saída</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaida} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Produto</Label>
                    <Select value={saidaForm.produto_id} onValueChange={v => setSaidaForm(p => ({ ...p, produto_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
                      <SelectContent>
                        {produtosAtivos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome} ({p.codigo}) — Stock: {p.quantidade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSaidaProduto && (
                      <p className="mt-1 text-xs text-muted-foreground">Stock disponível: <span className="font-mono font-semibold">{selectedSaidaProduto.quantidade}</span></p>
                    )}
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input type="number" min={1} max={selectedSaidaProduto?.quantidade} value={saidaForm.quantidade} onChange={e => setSaidaForm(p => ({ ...p, quantidade: Number(e.target.value) }))} required />
                  </div>
                  <div>
                    <Label>Responsável (quem entrega)</Label>
                    <Input value={saidaForm.responsavel} onChange={e => setSaidaForm(p => ({ ...p, responsavel: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Responsável (quem recebe)</Label>
                    <Input value={saidaForm.responsavel_recebeu} onChange={e => setSaidaForm(p => ({ ...p, responsavel_recebeu: e.target.value }))} placeholder="Opcional" />
                  </div>
                  <div>
                    <Label>Departamento</Label>
                    <Select value={saidaForm.departamento} onValueChange={v => setSaidaForm(p => ({ ...p, departamento: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Motivo</Label>
                    <Select value={saidaForm.motivo} onValueChange={v => setSaidaForm(p => ({ ...p, motivo: v, motivo_outro: v !== 'Outro' ? '' : p.motivo_outro }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>{motivos.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {saidaForm.motivo === 'Outro' && (
                    <div className="col-span-2">
                      <Label>Especifique o motivo</Label>
                      <Input value={saidaForm.motivo_outro} onChange={e => setSaidaForm(p => ({ ...p, motivo_outro: e.target.value }))} required placeholder="Descreva o motivo..." />
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !saidaForm.produto_id || !saidaForm.responsavel || !saidaForm.departamento || !saidaForm.motivo || (saidaForm.motivo === 'Outro' && !saidaForm.motivo_outro)}>
                  {submitting ? 'A processar...' : 'Confirmar Saída'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrada">
          <Card className="industrial-shadow max-w-2xl">
            <CardHeader><CardTitle className="text-lg">📥 Registo de Entrada</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleEntrada} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Produto</Label>
                    <Select value={entradaForm.produto_id} onValueChange={v => setEntradaForm(p => ({ ...p, produto_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger>
                      <SelectContent>
                        {produtosAtivos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome} ({p.codigo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input type="number" min={1} value={entradaForm.quantidade} onChange={e => setEntradaForm(p => ({ ...p, quantidade: Number(e.target.value) }))} required />
                  </div>
                  <div>
                    <Label>Responsável (quem entrega)</Label>
                    <Input value={entradaForm.responsavel} onChange={e => setEntradaForm(p => ({ ...p, responsavel: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Responsável (quem recebe)</Label>
                    <Input value={entradaForm.responsavel_recebeu} onChange={e => setEntradaForm(p => ({ ...p, responsavel_recebeu: e.target.value }))} placeholder="Opcional" />
                  </div>
                  <div>
                    <Label>Departamento</Label>
                    <Select value={entradaForm.departamento} onValueChange={v => setEntradaForm(p => ({ ...p, departamento: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fornecedor (opcional)</Label>
                    <Input value={entradaForm.fornecedor} onChange={e => setEntradaForm(p => ({ ...p, fornecedor: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Nº Nota (opcional)</Label>
                    <Input value={entradaForm.nota} onChange={e => setEntradaForm(p => ({ ...p, nota: e.target.value }))} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !entradaForm.produto_id || !entradaForm.responsavel || !entradaForm.departamento}>
                  {submitting ? 'A processar...' : 'Confirmar Entrada'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
