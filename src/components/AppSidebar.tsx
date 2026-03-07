import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, History, AlertTriangle, LogOut, Building2, Sun, Moon } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/movimentacoes', icon: ArrowLeftRight, label: 'Movimentações' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/departamentos', icon: Building2, label: 'Departamentos' },
];

export default function AppSidebar() {
  const location = useLocation();
  const { produtosStockBaixo } = useStock();
  const { signOut, role, profileName, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = profileName
    ? profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'U').toUpperCase();

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
              {initials}
            </div>
            <div>
              <p className="text-xs font-medium text-sidebar-accent-foreground">{profileName || user?.email}</p>
              <Badge variant="outline" className="mt-0.5 text-[10px] border-sidebar-border text-sidebar-muted">
                {role === 'admin' ? '👑 Admin' : '👷 Operador'}
              </Badge>
            </div>
          </div>
          <button onClick={signOut} className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
