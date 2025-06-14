
-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own data" ON public.instagram_users;

-- Crear políticas RLS más permisivas para instagram_users
-- Permitir que cualquier usuario autenticado pueda insertar sus datos
CREATE POLICY "Anyone can insert instagram users" 
  ON public.instagram_users 
  FOR INSERT
  WITH CHECK (true);

-- Permitir que cualquier usuario pueda ver todos los datos de instagram_users
-- (esto es necesario porque no tenemos auth.uid() para relacionar con los usuarios)
CREATE POLICY "Anyone can view instagram users" 
  ON public.instagram_users 
  FOR SELECT
  USING (true);

-- Permitir actualizaciones
CREATE POLICY "Anyone can update instagram users" 
  ON public.instagram_users 
  FOR UPDATE
  USING (true);

-- Permitir eliminaciones
CREATE POLICY "Anyone can delete instagram users" 
  ON public.instagram_users 
  FOR DELETE
  USING (true);
