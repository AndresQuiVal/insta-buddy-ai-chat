-- Habilitar realtime para la tabla prospect_task_status
ALTER TABLE public.prospect_task_status REPLICA IDENTITY FULL;
-- Agregar la tabla a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.prospect_task_status;