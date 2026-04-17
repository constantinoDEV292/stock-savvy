import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, ShieldCheck, BarChart3, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupNome, setSignupNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupNome);
    if (error) {
      toast({ title: 'Erro ao registar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conta criada!', description: 'Verifique o seu email para confirmar a conta.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — Branding panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-hero p-12 text-primary-foreground">
        {/* Decorative corn glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent shadow-glow">
            <Sprout className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">KiandaStock</h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/60">Gestão Inteligente</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Plataforma industrial
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Stock sob controlo,<br />
            <span className="text-gradient-corn">decisões mais rápidas.</span>
          </h2>
          <p className="mt-4 text-base text-primary-foreground/70">
            Plataforma profissional para fábricas que precisam de visibilidade total sobre material, equipamentos e movimentações em tempo real.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              { icon: Boxes, title: 'Inventário em tempo real', desc: 'Stock atualizado a cada movimentação' },
              { icon: BarChart3, title: 'Dashboards analíticos', desc: 'KPIs e tendências de consumo' },
              { icon: ShieldCheck, title: 'Auditoria completa', desc: 'Rastreie cada entrada e saída' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 backdrop-blur-sm">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-primary-foreground/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} KiandaStock · Pensado para a indústria
        </p>
      </div>

      {/* Right — Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-corn shadow-glow">
              <Sprout className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">KiandaStock</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gestão Inteligente</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Aceda ao seu painel de gestão de stock</p>
          </div>

          <Card className="border-border/60 shadow-elegant">
            <Tabs defaultValue="login">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Registar</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-2">
                <TabsContent value="login" className="mt-0 space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="nome@empresa.pt" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-pwd">Senha</Label>
                      <Input id="login-pwd" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95 shadow-elegant" disabled={loading}>
                      {loading ? 'A entrar...' : 'Entrar na plataforma'}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup" className="mt-0 space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="su-nome">Nome completo</Label>
                      <Input id="su-nome" value={signupNome} onChange={e => setSignupNome(e.target.value)} required placeholder="O seu nome" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="nome@empresa.pt" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-pwd">Senha</Label>
                      <Input id="su-pwd" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95 shadow-elegant" disabled={loading}>
                      {loading ? 'A registar...' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar, concorda com os termos de utilização da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
