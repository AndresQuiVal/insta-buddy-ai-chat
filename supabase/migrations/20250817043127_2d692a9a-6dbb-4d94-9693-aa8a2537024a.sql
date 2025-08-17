-- Habilitar realtime para la tabla instagram_messages
ALTER TABLE public.instagram_messages REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de realtime
ALTER publication supabase_realtime ADD TABLE public.instagram_messages;