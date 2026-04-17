import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-gradient-corn">404</p>
        <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço <span className="font-mono">{location.pathname}</span> não existe ou foi movido.
        </p>
        <a href="/" className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 transition">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
