-- Agregar las columnas faltantes para manejar follow-ups de todos los tipos de autoresponders
ALTER TABLE public.autoresponder_followups 
ADD COLUMN comment_autoresponder_id uuid,
ADD COLUMN general_autoresponder_id uuid;