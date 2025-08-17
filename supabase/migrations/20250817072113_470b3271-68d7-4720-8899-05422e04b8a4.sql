-- Habilitar replica identity FULL para capturar todos los cambios en instagram_messages
ALTER TABLE public.instagram_messages REPLICA IDENTITY FULL;