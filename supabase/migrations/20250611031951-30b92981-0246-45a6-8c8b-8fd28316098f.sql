
-- Eliminar las políticas RLS restrictivas existentes
DROP POLICY IF EXISTS "Allow all operations on autoresponder messages" ON public.autoresponder_messages;

-- Crear una política más permisiva que permita todas las operaciones
CREATE POLICY "Allow all operations on autoresponder messages" 
  ON public.autoresponder_messages 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- También actualizar las políticas del log si existen
DROP POLICY IF EXISTS "Allow all operations on autoresponder log" ON public.autoresponder_sent_log;

CREATE POLICY "Allow all operations on autoresponder log" 
  ON public.autoresponder_sent_log 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
