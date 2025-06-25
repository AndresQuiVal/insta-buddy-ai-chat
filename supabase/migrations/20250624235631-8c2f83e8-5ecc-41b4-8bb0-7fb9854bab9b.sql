
-- Agregar columna user_id a la tabla comment_autoresponders para asociar cada autoresponder con un usuario específico
ALTER TABLE public.comment_autoresponders 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento en las consultas filtradas por usuario
CREATE INDEX idx_comment_autoresponders_user_id_new ON public.comment_autoresponders(user_id);

-- Actualizar las políticas RLS existentes para usar la nueva columna user_id
DROP POLICY IF EXISTS "Users can view their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can create their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can update their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can delete their own comment autoresponders" ON public.comment_autoresponders;

-- Crear nuevas políticas RLS que usen user_id
CREATE POLICY "Users can view their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR DELETE 
  USING (auth.uid() = user_id);
