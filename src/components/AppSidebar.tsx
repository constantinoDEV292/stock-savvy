import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, History, AlertTriangle, LogOut, Building2, Sprout, BarChart3 } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/movimentacoes', icon: ArrowLeftRight, label: 'Movimentações' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/departamentos', icon: Building2, label: 'Departamentos' },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const { produtosStockBaixo } = useStock();
  const { signOut, role, profileName, user } = useAuth();

  const initials = profileName
    ? profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'U').toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-corn shadow-glow">
          <Sprout className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-sidebar-accent-foreground">KiandaStock</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-muted">Gestão Inteligente</p>
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
              onClick={onNavigate}
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
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{profileName || user?.email}</p>
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
