
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can create their own prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can update their own prospects" ON public.prospects;
DROP POLICY IF EXISTS "Users can view their own prospect messages" ON public.prospect_messages;
DROP POLICY IF EXISTS "Users can create their own prospect messages" ON public.prospect_messages;

-- Habilitar RLS en ambas tablas (por si no estaba habilitado)
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_messages ENABLE ROW LEVEL SECURITY;

-- Políticas simples que permiten acceso a todos los datos por ahora
-- (hasta que se implemente autenticación)
CREATE POLICY "Allow all prospects access" 
  ON public.prospects 
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all prospect messages access" 
  ON public.prospect_messages 
  FOR ALL
  USING (true)
  WITH CHECK (true);
