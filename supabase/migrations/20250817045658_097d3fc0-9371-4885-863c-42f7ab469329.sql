-- Habilitar RLS en tablas que lo necesitan
ALTER TABLE public.comment_autoresponder_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_last_activity ENABLE ROW LEVEL SECURITY;

-- Crear políticas para comment_autoresponder_log
CREATE POLICY "Allow all operations on comment autoresponder log" 
ON public.comment_autoresponder_log 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Crear políticas para prospect_last_activity
CREATE POLICY "Allow all operations on prospect last activity" 
ON public.prospect_last_activity 
FOR ALL 
USING (true) 
WITH CHECK (true);