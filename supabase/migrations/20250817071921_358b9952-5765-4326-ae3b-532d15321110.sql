-- Habilitar replica identity FULL para capturar todos los cambios
ALTER TABLE public.instagram_messages REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.instagram_messages;