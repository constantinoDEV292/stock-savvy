
-- Fix permissive INSERT policies: require authenticated user
DROP POLICY "Authenticated users can insert movements" ON public.movimentacoes;
CREATE POLICY "Authenticated users can insert movements" ON public.movimentacoes 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated users can insert alerts" ON public.alertas;
CREATE POLICY "Authenticated users can insert alerts" ON public.alertas 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);
