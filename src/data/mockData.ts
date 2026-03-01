import { Produto, Movimentacao, Alerta } from '@/types';

export const mockProdutos: Produto[] = [
  { id: '1', nome: 'Motor Elétrico 5CV', categoria: 'Equipamento', codigo: 'EQ-001', quantidade: 8, quantidade_minima: 3, localizacao: 'Armazém A', observacoes: 'Motor trifásico', data_criacao: '2024-01-15', ativo: true },
  { id: '2', nome: 'Rolamento 6205', categoria: 'Peça', codigo: 'PC-012', quantidade: 2, quantidade_minima: 10, localizacao: 'Armazém B', observacoes: '', data_criacao: '2024-01-20', ativo: true },
  { id: '3', nome: 'Óleo Hidráulico 20L', categoria: 'Material', codigo: 'MT-003', quantidade: 15, quantidade_minima: 5, localizacao: 'Armazém A', observacoes: 'ISO VG 46', data_criacao: '2024-02-01', ativo: true },
  { id: '4', nome: 'Correia Dentada HTD', categoria: 'Peça', codigo: 'PC-045', quantidade: 4, quantidade_minima: 5, localizacao: 'Armazém C', observacoes: '8M-1200', data_criacao: '2024-02-10', ativo: true },
  { id: '5', nome: 'Parafuso M12x50', categoria: 'Material', codigo: 'MT-089', quantidade: 150, quantidade_minima: 50, localizacao: 'Armazém B', observacoes: 'Inox A2', data_criacao: '2024-02-15', ativo: true },
  { id: '6', nome: 'Sensor Indutivo', categoria: 'Equipamento', codigo: 'EQ-023', quantidade: 1, quantidade_minima: 3, localizacao: 'Armazém A', observacoes: 'PNP NO', data_criacao: '2024-03-01', ativo: true },
  { id: '7', nome: 'Filtro de Ar Compressor', categoria: 'Peça', codigo: 'PC-067', quantidade: 6, quantidade_minima: 4, localizacao: 'Armazém C', observacoes: '', data_criacao: '2024-03-05', ativo: true },
  { id: '8', nome: 'Cabo Elétrico 4mm²', categoria: 'Material', codigo: 'MT-034', quantidade: 200, quantidade_minima: 50, localizacao: 'Armazém A', observacoes: 'Rolo 100m', data_criacao: '2024-03-10', ativo: false },
];

export const mockMovimentacoes: Movimentacao[] = [
  { id: '1', produto_id: '2', produto_nome: 'Rolamento 6205', tipo: 'saida', quantidade: 3, responsavel: 'Carlos Silva', departamento: 'Manutenção', motivo: 'Manutenção preventiva', data: '2024-03-15T09:30:00' },
  { id: '2', produto_id: '3', produto_nome: 'Óleo Hidráulico 20L', tipo: 'entrada', quantidade: 10, responsavel: 'Ana Costa', departamento: 'Compras', motivo: 'Reposição', fornecedor: 'Lubrificantes SA', nota: 'NF-4521', data: '2024-03-14T14:00:00' },
  { id: '3', produto_id: '6', produto_nome: 'Sensor Indutivo', tipo: 'saida', quantidade: 2, responsavel: 'Pedro Martins', departamento: 'Produção', motivo: 'Substituição', data: '2024-03-14T10:15:00' },
  { id: '4', produto_id: '5', produto_nome: 'Parafuso M12x50', tipo: 'saida', quantidade: 20, responsavel: 'João Ferreira', departamento: 'Produção', motivo: 'Uso produção', data: '2024-03-13T16:45:00' },
  { id: '5', produto_id: '1', produto_nome: 'Motor Elétrico 5CV', tipo: 'entrada', quantidade: 2, responsavel: 'Ana Costa', departamento: 'Compras', motivo: 'Compra', fornecedor: 'Motores Lda', nota: 'NF-4498', data: '2024-03-13T11:00:00' },
  { id: '6', produto_id: '4', produto_nome: 'Correia Dentada HTD', tipo: 'saida', quantidade: 1, responsavel: 'Carlos Silva', departamento: 'Manutenção', motivo: 'Manutenção corretiva', data: '2024-03-12T08:30:00' },
  { id: '7', produto_id: '7', produto_nome: 'Filtro de Ar Compressor', tipo: 'entrada', quantidade: 4, responsavel: 'Maria Santos', departamento: 'Compras', motivo: 'Reposição', data: '2024-03-11T13:20:00' },
  { id: '8', produto_id: '2', produto_nome: 'Rolamento 6205', tipo: 'saida', quantidade: 5, responsavel: 'Pedro Martins', departamento: 'Produção', motivo: 'Uso produção', data: '2024-03-10T15:00:00' },
];

export const mockAlertas: Alerta[] = [
  { id: '1', produto_id: '2', produto_nome: 'Rolamento 6205', tipo_alerta: 'stock_baixo', mensagem: 'Stock atual (2) abaixo do mínimo (10)', data: '2024-03-15T09:31:00', status_envio: 'enviado' },
  { id: '2', produto_id: '6', produto_nome: 'Sensor Indutivo', tipo_alerta: 'stock_baixo', mensagem: 'Stock atual (1) abaixo do mínimo (3)', data: '2024-03-14T10:16:00', status_envio: 'enviado' },
  { id: '3', produto_id: '4', produto_nome: 'Correia Dentada HTD', tipo_alerta: 'stock_baixo', mensagem: 'Stock atual (4) abaixo do mínimo (5)', data: '2024-03-12T08:31:00', status_envio: 'pendente' },
];
