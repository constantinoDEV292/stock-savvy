import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, History, AlertTriangle, Settings } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/movimentacoes', icon: ArrowLeftRight, label: 'Movimentações' },
  { to: '/historico', icon: History, label: 'Histórico' },
];

export default function AppSidebar() {
  const location = useLocation();
  const { produtosStockBaixo } = useStock();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Package className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-sidebar-accent-foreground">STOCKFLOW</h1>
          <p className="text-[10px] uppercase tracking-widest text-sidebar-muted">Gestão de Stock</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Alert badge */}
      {produtosStockBaixo.length > 0 && (
        <div className="mx-3 mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4 animate-pulse-warning" />
            <span className="text-xs font-semibold">{produtosStockBaixo.length} alertas stock baixo</span>
          </div>
        </div>
      )}

      {/* User */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            AD
          </div>
          <div>
            <p className="text-xs font-medium text-sidebar-accent-foreground">Administrador</p>
            <p className="text-[10px] text-sidebar-muted">admin@fabrica.pt</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
