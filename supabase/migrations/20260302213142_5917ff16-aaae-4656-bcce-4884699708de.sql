
-- Add foto_url column to produtos
ALTER TABLE public.produtos ADD COLUMN foto_url text;

-- Create departamentos table
CREATE TABLE public.departamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departamentos"
ON public.departamentos FOR SELECT
USING (true);

CREATE POLICY "Admins can insert departamentos"
ON public.departamentos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update departamentos"
ON public.departamentos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete departamentos"
ON public.departamentos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default departamentos
INSERT INTO public.departamentos (nome) VALUES
  ('Produção'), ('Manutenção'), ('Compras'), ('Logística'), ('Qualidade');

-- Add responsavel_recebeu to movimentacoes
ALTER TABLE public.movimentacoes ADD COLUMN responsavel_recebeu text;

-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true);

CREATE POLICY "Anyone can view product photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated users can upload product photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-photos' AND auth.uid() IS NOT NULL);
