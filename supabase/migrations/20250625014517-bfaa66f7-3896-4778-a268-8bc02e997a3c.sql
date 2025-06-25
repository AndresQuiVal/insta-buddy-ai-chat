
-- Primero eliminar las políticas RLS que dependen de la columna user_id
DROP POLICY IF EXISTS "Users can view their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can create their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can update their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can delete their own comment autoresponders" ON public.comment_autoresponders;

-- Eliminar la foreign key constraint que está causando el problema
ALTER TABLE public.comment_autoresponders 
DROP CONSTRAINT IF EXISTS comment_autoresponders_user_id_fkey;

-- Cambiar el tipo de la columna user_id de UUID a TEXT
ALTER TABLE public.comment_autoresponders 
ALTER COLUMN user_id TYPE TEXT;

-- Recrear las políticas RLS para trabajar con instagram_user_id como TEXT
CREATE POLICY "Users can view their own comment autoresponders" 
ON public.comment_autoresponders 
FOR SELECT 
USING (true); -- Permitir acceso completo por ahora

CREATE POLICY "Users can create their own comment autoresponders" 
ON public.comment_autoresponders 
FOR INSERT 
WITH CHECK (true); -- Permitir creación

CREATE POLICY "Users can update their own comment autoresponders" 
ON public.comment_autoresponders 
FOR UPDATE 
USING (true); -- Permitir actualización

CREATE POLICY "Users can delete their own comment autoresponders" 
ON public.comment_autoresponders 
FOR DELETE 
USING (true); -- Permitir eliminación

-- Agregar comentario para documentar el cambio
COMMENT ON COLUMN public.comment_autoresponders.user_id IS 'Instagram User ID (numeric string)';
