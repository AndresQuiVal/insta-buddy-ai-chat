-- Agregar columna para verificar si el usuario debe seguir la cuenta
ALTER TABLE public.comment_autoresponders 
ADD COLUMN require_follower BOOLEAN NOT NULL DEFAULT false;

-- Agregar la misma columna a general_comment_autoresponders
ALTER TABLE public.general_comment_autoresponders 
ADD COLUMN require_follower BOOLEAN NOT NULL DEFAULT false;

-- Comentarios para documentar la nueva funcionalidad
COMMENT ON COLUMN public.comment_autoresponders.require_follower IS 'Si está activado, solo enviará mensajes a usuarios que sigan la cuenta';
COMMENT ON COLUMN public.general_comment_autoresponders.require_follower IS 'Si está activado, solo enviará mensajes a usuarios que sigan la cuenta';