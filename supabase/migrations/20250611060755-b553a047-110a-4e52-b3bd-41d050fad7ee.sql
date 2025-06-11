
-- Add keywords functionality to autoresponder_messages table
ALTER TABLE public.autoresponder_messages 
ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT NULL;

ALTER TABLE public.autoresponder_messages 
ADD COLUMN IF NOT EXISTS use_keywords boolean DEFAULT false;

-- Add comments to document the new columns
COMMENT ON COLUMN public.autoresponder_messages.keywords IS 'Lista de palabras clave que deben estar presentes en el mensaje para activar el autoresponder';
COMMENT ON COLUMN public.autoresponder_messages.use_keywords IS 'Si está activado, solo responderá si el mensaje contiene alguna de las palabras clave';
