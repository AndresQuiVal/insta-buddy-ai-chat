
-- Agregar campo de palabras clave a autoresponder_messages
ALTER TABLE public.autoresponder_messages 
ADD COLUMN keywords text[] DEFAULT NULL;

-- Agregar campo para activar/desactivar el filtro de palabras clave
ALTER TABLE public.autoresponder_messages 
ADD COLUMN use_keywords boolean DEFAULT false;

COMMENT ON COLUMN public.autoresponder_messages.keywords IS 'Lista de palabras clave que deben estar presentes en el mensaje para activar el autoresponder';
COMMENT ON COLUMN public.autoresponder_messages.use_keywords IS 'Si está activado, solo responderá si el mensaje contiene alguna de las palabras clave';
