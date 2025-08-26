-- ARREGLAR PROBLEMA DE SEGURIDAD: Habilitar RLS en tabla comment_autoresponders
ALTER TABLE public.comment_autoresponders ENABLE ROW LEVEL SECURITY;