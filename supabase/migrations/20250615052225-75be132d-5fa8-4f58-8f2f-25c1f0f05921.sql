
-- Eliminar trigger que depende de la función
DROP TRIGGER IF EXISTS trigger_update_prospect_analysis_with_profile ON instagram_messages;

-- Ahora eliminar la función
DROP FUNCTION IF EXISTS public.update_prospect_analysis_with_profile();

-- Eliminar tabla instagram_profiles y todas sus referencias
DROP TABLE IF EXISTS public.instagram_profiles CASCADE;

-- Limpiar columnas de referencia a instagram_profiles de autoresponder_messages
ALTER TABLE public.autoresponder_messages 
DROP COLUMN IF EXISTS instagram_profile_id;

-- Limpiar columnas de referencia a instagram_profiles de comment_autoresponders  
ALTER TABLE public.comment_autoresponders
DROP COLUMN IF EXISTS instagram_profile_id;

-- Limpiar columnas de referencia a instagram_profiles de instagram_messages
ALTER TABLE public.instagram_messages
DROP COLUMN IF EXISTS instagram_profile_id;

-- Limpiar columnas de referencia a instagram_profiles de ideal_client_traits
ALTER TABLE public.ideal_client_traits
DROP COLUMN IF EXISTS instagram_profile_id;

-- Limpiar columnas de referencia a instagram_profiles de prospect_analysis
ALTER TABLE public.prospect_analysis
DROP COLUMN IF EXISTS instagram_profile_id;

-- Eliminar funciones relacionadas con profiles
DROP FUNCTION IF EXISTS public.get_active_instagram_token(text);
DROP FUNCTION IF EXISTS public.calculate_advanced_metrics_by_profile(uuid);
DROP FUNCTION IF EXISTS public.increment_nuevos_prospectos(uuid, integer);
DROP FUNCTION IF EXISTS public.reset_nuevos_prospectos(uuid);

-- Crear políticas RLS simples para autoresponder_messages basadas en instagram_user_id_ref
CREATE POLICY "Users can view their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR SELECT 
  USING (
    instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  );

CREATE POLICY "Users can create their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR INSERT 
  WITH CHECK (
    instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  );

CREATE POLICY "Users can update their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR UPDATE 
  USING (
    instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  );

CREATE POLICY "Users can delete their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR DELETE 
  USING (
    instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  );

-- Crear políticas RLS para comment_autoresponders
CREATE POLICY "Users can view their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR SELECT 
  USING (true); -- Temporalmente permisivo

CREATE POLICY "Users can create their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR INSERT 
  WITH CHECK (true); -- Temporalmente permisivo

CREATE POLICY "Users can update their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR UPDATE 
  USING (true); -- Temporalmente permisivo

CREATE POLICY "Users can delete their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR DELETE 
  USING (true); -- Temporalmente permisivo
