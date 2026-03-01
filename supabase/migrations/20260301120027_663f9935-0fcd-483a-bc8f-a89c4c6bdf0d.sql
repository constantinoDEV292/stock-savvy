
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operador');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'operador',
  UNIQUE (user_id, role)
);

-- Products table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Equipamento', 'Material', 'Peça')),
  codigo TEXT NOT NULL UNIQUE,
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  quantidade_minima INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_minima >= 0),
  localizacao TEXT NOT NULL DEFAULT 'Armazém A',
  observacoes TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Movements table
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  responsavel TEXT NOT NULL,
  departamento TEXT NOT NULL,
  motivo TEXT NOT NULL DEFAULT '',
  fornecedor TEXT,
  nota TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('saida', 'stock_baixo')),
  mensagem TEXT NOT NULL,
  status_envio TEXT NOT NULL DEFAULT 'pendente' CHECK (status_envio IN ('enviado', 'pendente', 'erro')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Produtos policies (all authenticated users can view, only admins can modify)
CREATE POLICY "Authenticated users can view active products" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.produtos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Movimentacoes policies (all authenticated can view and insert)
CREATE POLICY "Authenticated users can view movements" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert movements" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true);

-- Alertas policies
CREATE POLICY "Authenticated users can view alerts" ON public.alertas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON public.alertas FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operador');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on produtos
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
