-- Agregar columna para mensaje de confirmación personalizable en autorespondedores de comentarios
ALTER TABLE public.comment_autoresponders 
ADD COLUMN follower_confirmation_message TEXT DEFAULT '¡Hola! 😊 Gracias por comentar. Para poder ayudarte mejor, ¿podrías confirmar si me sigues? Solo responde ''sí'' si ya me sigues y te envío lo que necesitas 💪';

-- Agregar columna para mensaje de confirmación personalizable en autorespondedores generales
ALTER TABLE public.general_comment_autoresponders 
ADD COLUMN follower_confirmation_message TEXT DEFAULT '¡Hola! 😊 Gracias por comentar. Para poder ayudarte mejor, ¿podrías confirmar si me sigues? Solo responde ''sí'' si ya me sigues y te envío lo que necesitas 💪';