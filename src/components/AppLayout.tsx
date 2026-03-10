import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStock } from '@/contexts/StockContext';
import AppSidebar from '@/components/AppSidebar';

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { produtosStockBaixo } = useStock();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : ''
        }
      >
        <AppSidebar onNavigate={() => isMobile && setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className={isMobile ? 'min-h-screen' : 'ml-64 min-h-screen'}>
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
          {isMobile ? (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {!sidebarOpen && produtosStockBaixo.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {produtosStockBaixo.length}
                </span>
              )}
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
