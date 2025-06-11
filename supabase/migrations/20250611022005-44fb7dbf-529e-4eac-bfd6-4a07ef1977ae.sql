
-- Agregar columna para controlar si solo enviar el primer mensaje
ALTER TABLE public.autoresponder_messages 
ADD COLUMN send_only_first_message boolean NOT NULL DEFAULT false;

-- Comentario explicativo
COMMENT ON COLUMN public.autoresponder_messages.send_only_first_message IS 'Si está activado, solo envía el autoresponder en el primer mensaje del usuario. Si está desactivado, responde a todos los mensajes.';
