
-- Agregar columna para almacenar múltiples mensajes de respuesta pública
ALTER TABLE public.comment_autoresponders 
ADD COLUMN public_reply_messages TEXT[] DEFAULT ARRAY['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊'];

-- Actualizar comentario de la tabla
COMMENT ON COLUMN public.comment_autoresponders.public_reply_messages IS 'Array de mensajes públicos que se envían como respuesta al comentario (máximo 10)';

-- Agregar constraint para limitar a máximo 10 mensajes
ALTER TABLE public.comment_autoresponders 
ADD CONSTRAINT comment_autoresponders_max_public_replies 
CHECK (array_length(public_reply_messages, 1) <= 10 AND array_length(public_reply_messages, 1) >= 1);
