
-- Eliminar autoresponders de comentarios que no tienen usuario asignado
DELETE FROM public.comment_autoresponders 
WHERE user_id IS NULL;

-- Hacer la columna user_id NOT NULL para evitar futuros problemas
ALTER TABLE public.comment_autoresponders 
ALTER COLUMN user_id SET NOT NULL;
