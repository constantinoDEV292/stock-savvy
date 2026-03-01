import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package } from 'lucide-react';
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">STOCKFLOW</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Gestão de Stock</p>
          </div>
        </div>

        <Card className="industrial-shadow">
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Registar</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="admin@fabrica.pt" />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'A entrar...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={signupNome} onChange={e => setSignupNome(e.target.value)} required placeholder="O seu nome" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="nome@fabrica.pt" />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'A registar...' : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
