
-- Eliminar las políticas RLS existentes que requieren autenticación
DROP POLICY IF EXISTS "Users can view their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can create their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can update their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can delete their own autoresponder messages" ON public.autoresponder_messages;

-- Crear políticas más flexibles que permitan operaciones sin autenticación estricta
CREATE POLICY "Allow all operations on autoresponder messages" 
  ON public.autoresponder_messages 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- También actualizar las políticas del log para que funcione correctamente
DROP POLICY IF EXISTS "Users can view their own autoresponder log" ON public.autoresponder_sent_log;
DROP POLICY IF EXISTS "System can insert autoresponder log" ON public.autoresponder_sent_log;

CREATE POLICY "Allow all operations on autoresponder log" 
  ON public.autoresponder_sent_log 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
