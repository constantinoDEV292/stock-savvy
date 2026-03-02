import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Departamento {
  id: string;
  nome: string;
  created_at: string;
}

export default function Departamentos() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [novo, setNovo] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = role === 'admin';

  const fetchDepartamentos = async () => {
    const { data } = await supabase.from('departamentos').select('*').order('nome');
    if (data) setDepartamentos(data);
    setLoading(false);
  };

  useEffect(() => { fetchDepartamentos(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo.trim()) return;
    const { error } = await supabase.from('departamentos').insert({ nome: novo.trim() });
    if (error) {
      toast({ title: 'Erro', description: error.message.includes('unique') ? 'Departamento já existe' : error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Departamento adicionado' });
      setNovo('');
      fetchDepartamentos();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('departamentos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      fetchDepartamentos();
    }
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">A carregar...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Departamentos / Áreas</h1>
        <p className="text-sm text-muted-foreground">Gerir departamentos disponíveis nas movimentações</p>
      </div>

      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-3 max-w-md">
          <Input placeholder="Nome do departamento..." value={novo} onChange={e => setNovo(e.target.value)} required />
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
        </form>
      )}

      <Card className="industrial-shadow max-w-md">
        <CardContent className="p-0">
          <ul className="divide-y">
            {departamentos.map(d => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{d.nome}</span>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
            {departamentos.length === 0 && (
              <li className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum departamento cadastrado</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
