import React, { createContext, useContext, useState } from 'react';
import { Produto, Movimentacao, Alerta } from '@/types';
import { mockProdutos, mockMovimentacoes, mockAlertas } from '@/data/mockData';

interface StockContextType {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  alertas: Alerta[];
  addProduto: (p: Omit<Produto, 'id' | 'data_criacao'>) => void;
  updateProduto: (id: string, p: Partial<Produto>) => void;
  addMovimentacao: (m: Omit<Movimentacao, 'id' | 'data'>) => void;
  produtosStockBaixo: Produto[];
  totalItens: number;
}

const StockContext = createContext<StockContextType | null>(null);

export const useStock = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be inside StockProvider');
  return ctx;
};

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutos);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(mockMovimentacoes);
  const [alertas, setAlertas] = useState<Alerta[]>(mockAlertas);

  const addProduto = (p: Omit<Produto, 'id' | 'data_criacao'>) => {
    const novo: Produto = {
      ...p,
      id: String(Date.now()),
      data_criacao: new Date().toISOString().split('T')[0],
    };
    setProdutos(prev => [novo, ...prev]);
  };

  const updateProduto = (id: string, updates: Partial<Produto>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addMovimentacao = (m: Omit<Movimentacao, 'id' | 'data'>) => {
    const nova: Movimentacao = {
      ...m,
      id: String(Date.now()),
      data: new Date().toISOString(),
    };
    setMovimentacoes(prev => [nova, ...prev]);

    // Update product quantity
    setProdutos(prev => prev.map(p => {
      if (p.id === m.produto_id) {
        const novaQtd = m.tipo === 'entrada' 
          ? p.quantidade + m.quantidade 
          : p.quantidade - m.quantidade;
        
        // Check low stock alert
        if (novaQtd <= p.quantidade_minima) {
          const alerta: Alerta = {
            id: String(Date.now() + 1),
            produto_id: p.id,
            produto_nome: p.nome,
            tipo_alerta: 'stock_baixo',
            mensagem: `Stock atual (${novaQtd}) abaixo do mínimo (${p.quantidade_minima})`,
            data: new Date().toISOString(),
            status_envio: 'pendente',
          };
          setAlertas(prev => [alerta, ...prev]);
        }

        return { ...p, quantidade: Math.max(0, novaQtd) };
      }
      return p;
    }));
  };

  const produtosStockBaixo = produtos.filter(p => p.ativo && p.quantidade <= p.quantidade_minima);
  const totalItens = produtos.filter(p => p.ativo).reduce((sum, p) => sum + p.quantidade, 0);

  return (
    <StockContext.Provider value={{ produtos, movimentacoes, alertas, addProduto, updateProduto, addMovimentacao, produtosStockBaixo, totalItens }}>
      {children}
    </StockContext.Provider>
  );
};
