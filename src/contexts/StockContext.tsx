import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Produto = Tables<'produtos'>;
type Movimentacao = Tables<'movimentacoes'>;

interface StockContextType {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  loading: boolean;
  addProduto: (p: TablesInsert<'produtos'>) => Promise<void>;
  updateProduto: (id: string, p: Partial<Produto>) => Promise<void>;
  addMovimentacao: (m: Omit<TablesInsert<'movimentacoes'>, 'id' | 'created_at'>) => Promise<void>;
  produtosStockBaixo: Produto[];
  totalItens: number;
  refresh: () => Promise<void>;
}

const StockContext = createContext<StockContextType | null>(null);

export const useStock = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be inside StockProvider');
  return ctx;
};

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [prodRes, movRes] = await Promise.all([
      supabase.from('produtos').select('*').order('created_at', { ascending: false }),
      supabase.from('movimentacoes').select('*').order('created_at', { ascending: false }).limit(5000),
    ]);

    if (prodRes.data) setProdutos(prodRes.data);
    if (movRes.data) setMovimentacoes(movRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addProduto = async (p: TablesInsert<'produtos'>) => {
    const { error } = await supabase.from('produtos').insert(p);
    if (error) throw error;
    await fetchData();
  };

  const updateProduto = async (id: string, updates: Partial<Produto>) => {
    const { error } = await supabase.from('produtos').update(updates).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const addMovimentacao = async (m: Omit<TablesInsert<'movimentacoes'>, 'id' | 'created_at'>) => {
    // Get current product
    const produto = produtos.find(p => p.id === m.produto_id);
    if (!produto) throw new Error('Produto não encontrado');

    if (m.tipo === 'saida' && m.quantidade > produto.quantidade) {
      throw new Error('Quantidade maior que o stock disponível');
    }

    // Insert movement
    const { error: movError } = await supabase.from('movimentacoes').insert(m);
    if (movError) throw movError;

    // Update product quantity
    const novaQtd = m.tipo === 'entrada' 
      ? produto.quantidade + m.quantidade 
      : produto.quantidade - m.quantidade;

    const { error: prodError } = await supabase
      .from('produtos')
      .update({ quantidade: novaQtd })
      .eq('id', m.produto_id);
    if (prodError) throw prodError;

    // Check low stock alert and notify
    if (novaQtd <= produto.quantidade_minima) {
      await supabase.from('alertas').insert({
        produto_id: produto.id,
        tipo_alerta: 'stock_baixo',
        mensagem: `Stock atual (${novaQtd}) abaixo do mínimo (${produto.quantidade_minima})`,
      });

      // Send Telegram alert for low stock
      supabase.functions.invoke('notify-movement', {
        body: {
          tipo: 'stock_baixo',
          produto_nome: produto.nome,
          quantidade: novaQtd,
          quantidade_minima: produto.quantidade_minima,
          responsavel: m.responsavel,
          departamento: m.departamento,
          motivo: m.motivo,
        },
      }).catch(() => {});
    }

    // Send email notification (fire and forget)
    supabase.functions.invoke('notify-movement', {
      body: {
        tipo: m.tipo,
        produto_nome: produto.nome,
        quantidade: m.quantidade,
        responsavel: m.responsavel,
        departamento: m.departamento,
        motivo: m.motivo,
        responsavel_recebeu: (m as any).responsavel_recebeu || null,
      },
    }).catch(() => {}); // Don't block on notification failure

    await fetchData();
  };

  const produtosStockBaixo = produtos.filter(p => p.ativo && p.quantidade <= p.quantidade_minima);
  const totalItens = produtos.filter(p => p.ativo).reduce((sum, p) => sum + p.quantidade, 0);

  return (
    <StockContext.Provider value={{ produtos, movimentacoes, loading, addProduto, updateProduto, addMovimentacao, produtosStockBaixo, totalItens, refresh: fetchData }}>
      {children}
    </StockContext.Provider>
  );
};
