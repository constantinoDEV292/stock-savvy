export type UserRole = 'admin' | 'operador';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  data_criacao: string;
}

export type Categoria = 'Equipamento' | 'Material' | 'Peça';

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  codigo: string;
  quantidade: number;
  quantidade_minima: number;
  localizacao: string;
  observacoes: string;
  data_criacao: string;
  ativo: boolean;
}

export type TipoMovimentacao = 'entrada' | 'saida';

export interface Movimentacao {
  id: string;
  produto_id: string;
  produto_nome: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  responsavel: string;
  departamento: string;
  motivo: string;
  fornecedor?: string;
  nota?: string;
  data: string;
}

export interface Alerta {
  id: string;
  produto_id: string;
  produto_nome: string;
  tipo_alerta: 'saida' | 'stock_baixo';
  mensagem: string;
  data: string;
  status_envio: 'enviado' | 'pendente' | 'erro';
}
