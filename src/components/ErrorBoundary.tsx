import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Captured error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-elegant">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="mb-2 text-xl font-bold">Ocorreu um erro</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Algo correu mal ao carregar esta página. Pode tentar recarregar ou voltar ao início.
            </p>
            {this.state.error?.message && (
              <p className="mb-6 rounded-lg bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" /> Recarregar
              </button>
              <button
                onClick={this.handleHome}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Home className="h-4 w-4" /> Início
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
