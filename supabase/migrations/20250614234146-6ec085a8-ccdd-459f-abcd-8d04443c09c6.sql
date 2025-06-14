
-- Primero eliminar todas las políticas RLS que dependen de user_id
DROP POLICY IF EXISTS "Users can view their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can create their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can update their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can delete their own autoresponder messages" ON public.autoresponder_messages;
DROP POLICY IF EXISTS "Users can view their own autoresponder log" ON public.autoresponder_sent_log;

DROP POLICY IF EXISTS "Users can view their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can create their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can update their own comment autoresponders" ON public.comment_autoresponders;
DROP POLICY IF EXISTS "Users can delete their own comment autoresponders" ON public.comment_autoresponders;

DROP POLICY IF EXISTS "Users can view their own ideal client traits" ON public.ideal_client_traits;
DROP POLICY IF EXISTS "Users can create their own ideal client traits" ON public.ideal_client_traits;
DROP POLICY IF EXISTS "Users can update their own ideal client traits" ON public.ideal_client_traits;
DROP POLICY IF EXISTS "Users can delete their own ideal client traits" ON public.ideal_client_traits;

-- Crear tabla de perfiles de Instagram
CREATE TABLE public.instagram_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Métricas del dashboard
  nuevos_prospectos_contactados INTEGER NOT NULL DEFAULT 0,
  
  -- Configuraciones de IA
  openai_api_key TEXT,
  ia_persona TEXT DEFAULT 'Eres un asistente profesional y amigable que ayuda con ventas y prospección.',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.instagram_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para instagram_profiles
CREATE POLICY "Users can view their own instagram profiles" 
  ON public.instagram_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own instagram profiles" 
  ON public.instagram_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instagram profiles" 
  ON public.instagram_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instagram profiles" 
  ON public.instagram_profiles 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Ahora modificar las tablas existentes
ALTER TABLE public.instagram_messages 
ADD COLUMN instagram_profile_id UUID REFERENCES public.instagram_profiles(id) ON DELETE CASCADE;

-- Modificar autoresponder_messages 
ALTER TABLE public.autoresponder_messages 
DROP COLUMN user_id CASCADE,
ADD COLUMN instagram_profile_id UUID REFERENCES public.instagram_profiles(id) ON DELETE CASCADE;

-- Modificar comment_autoresponders
ALTER TABLE public.comment_autoresponders 
DROP COLUMN user_id CASCADE,
ADD COLUMN instagram_profile_id UUID REFERENCES public.instagram_profiles(id) ON DELETE CASCADE;

-- Modificar ideal_client_traits
ALTER TABLE public.ideal_client_traits 
DROP COLUMN user_id CASCADE,
ADD COLUMN instagram_profile_id UUID REFERENCES public.instagram_profiles(id) ON DELETE CASCADE;

-- Modificar prospect_analysis
ALTER TABLE public.prospect_analysis 
ADD COLUMN instagram_profile_id UUID REFERENCES public.instagram_profiles(id) ON DELETE CASCADE;

-- Crear nuevas políticas RLS basadas en instagram_profile_id
CREATE POLICY "Users can view autoresponder messages through profile" 
  ON public.autoresponder_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = autoresponder_messages.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create autoresponder messages through profile" 
  ON public.autoresponder_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = autoresponder_messages.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update autoresponder messages through profile" 
  ON public.autoresponder_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = autoresponder_messages.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete autoresponder messages through profile" 
  ON public.autoresponder_messages 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = autoresponder_messages.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas para comment_autoresponders
CREATE POLICY "Users can view comment autoresponders through profile" 
  ON public.comment_autoresponders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = comment_autoresponders.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comment autoresponders through profile" 
  ON public.comment_autoresponders 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = comment_autoresponders.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update comment autoresponders through profile" 
  ON public.comment_autoresponders 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = comment_autoresponders.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete comment autoresponders through profile" 
  ON public.comment_autoresponders 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = comment_autoresponders.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas para ideal_client_traits
CREATE POLICY "Users can view ideal client traits through profile" 
  ON public.ideal_client_traits 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = ideal_client_traits.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ideal client traits through profile" 
  ON public.ideal_client_traits 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = ideal_client_traits.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ideal client traits through profile" 
  ON public.ideal_client_traits 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = ideal_client_traits.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ideal client traits through profile" 
  ON public.ideal_client_traits 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.instagram_profiles 
      WHERE id = ideal_client_traits.instagram_profile_id 
      AND user_id = auth.uid()
    )
  );

-- Crear índices para mejor rendimiento
CREATE INDEX idx_instagram_profiles_user_id ON public.instagram_profiles(user_id);
CREATE INDEX idx_instagram_profiles_instagram_user_id ON public.instagram_profiles(instagram_user_id);
CREATE INDEX idx_instagram_messages_profile ON public.instagram_messages(instagram_profile_id);
CREATE INDEX idx_autoresponder_messages_profile ON public.autoresponder_messages(instagram_profile_id);
CREATE INDEX idx_comment_autoresponders_profile ON public.comment_autoresponders(instagram_profile_id);
CREATE INDEX idx_ideal_client_traits_profile ON public.ideal_client_traits(instagram_profile_id);
CREATE INDEX idx_prospect_analysis_profile ON public.prospect_analysis(instagram_profile_id);

-- Función para obtener token activo de un perfil
CREATE OR REPLACE FUNCTION public.get_active_instagram_token(profile_instagram_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  SELECT access_token INTO token
  FROM public.instagram_profiles
  WHERE instagram_user_id = profile_instagram_user_id
    AND is_active = true
    AND (token_expires_at IS NULL OR token_expires_at > now());
  
  RETURN token;
END;
$$;

-- Función para calcular métricas avanzadas por perfil de Instagram
CREATE OR REPLACE FUNCTION public.calculate_advanced_metrics_by_profile(profile_id UUID)
RETURNS TABLE(
  total_sent integer, 
  total_responses integer, 
  total_invitations integer, 
  total_presentations integer, 
  total_inscriptions integer, 
  messages_per_response numeric, 
  messages_per_invitation numeric, 
  messages_per_presentation numeric, 
  invitations_per_presentation numeric, 
  messages_per_inscription numeric, 
  invitations_per_inscription numeric, 
  presentations_per_inscription numeric, 
  today_messages integer, 
  response_rate_percentage numeric, 
  avg_response_time_seconds numeric, 
  last_message_date timestamp with time zone,
  nuevos_prospectos_contactados integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  profile_nuevos_prospectos INTEGER;
BEGIN
  -- Obtener nuevos prospectos contactados del perfil
  SELECT ip.nuevos_prospectos_contactados INTO profile_nuevos_prospectos
  FROM public.instagram_profiles ip
  WHERE ip.id = profile_id;
  
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE message_type = 'sent') as sent_count,
      COUNT(*) FILTER (WHERE message_type = 'received') as received_count,
      COUNT(*) FILTER (WHERE is_invitation = true) as invitation_count,
      COUNT(*) FILTER (WHERE is_presentation = true) as presentation_count,
      COUNT(*) FILTER (WHERE is_inscription = true) as inscription_count,
      COUNT(*) FILTER (WHERE message_type = 'sent' AND created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day') as today_sent,
      AVG(response_time_seconds) FILTER (WHERE response_time_seconds IS NOT NULL) as avg_response_time,
      MAX(created_at) FILTER (WHERE message_type = 'sent') as last_sent
    FROM instagram_messages
    WHERE instagram_profile_id = profile_id
  )
  SELECT 
    sent_count::integer,
    received_count::integer,
    invitation_count::integer,
    presentation_count::integer,
    inscription_count::integer,
    CASE WHEN received_count > 0 THEN ROUND(sent_count::numeric / received_count::numeric, 1) ELSE 0 END,
    CASE WHEN invitation_count > 0 THEN ROUND(sent_count::numeric / invitation_count::numeric, 1) ELSE 0 END,
    CASE WHEN presentation_count > 0 THEN ROUND(sent_count::numeric / presentation_count::numeric, 1) ELSE 0 END,
    CASE WHEN presentation_count > 0 THEN ROUND(invitation_count::numeric / presentation_count::numeric, 1) ELSE 0 END,
    CASE WHEN inscription_count > 0 THEN ROUND(sent_count::numeric / inscription_count::numeric, 1) ELSE 0 END,
    CASE WHEN inscription_count > 0 THEN ROUND(invitation_count::numeric / inscription_count::numeric, 1) ELSE 0 END,
    CASE WHEN inscription_count > 0 THEN ROUND(presentation_count::numeric / inscription_count::numeric, 1) ELSE 0 END,
    today_sent::integer,
    CASE WHEN sent_count > 0 THEN ROUND((received_count::numeric / sent_count::numeric) * 100, 1) ELSE 0 END,
    COALESCE(avg_response_time, 0)::numeric,
    last_sent,
    COALESCE(profile_nuevos_prospectos, 0)::integer
  FROM metrics;
END;
$$;

-- Función para actualizar contador de nuevos prospectos
CREATE OR REPLACE FUNCTION public.increment_nuevos_prospectos(profile_id UUID, increment_by INTEGER DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.instagram_profiles 
  SET 
    nuevos_prospectos_contactados = nuevos_prospectos_contactados + increment_by,
    updated_at = now()
  WHERE id = profile_id;
END;
$$;

-- Función para resetear contador de nuevos prospectos
CREATE OR REPLACE FUNCTION public.reset_nuevos_prospectos(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.instagram_profiles 
  SET 
    nuevos_prospectos_contactados = 0,
    updated_at = now()
  WHERE id = profile_id;
END;
$$;

-- Trigger para actualizar prospect_analysis con instagram_profile_id cuando se inserte mensaje
CREATE OR REPLACE FUNCTION public.update_prospect_analysis_with_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar análisis de prospecto con el profile_id
  INSERT INTO prospect_analysis (sender_id, instagram_profile_id, message_count, last_analyzed_at)
  VALUES (NEW.sender_id, NEW.instagram_profile_id, 1, now())
  ON CONFLICT (sender_id) 
  DO UPDATE SET 
    message_count = prospect_analysis.message_count + 1,
    last_analyzed_at = now(),
    instagram_profile_id = NEW.instagram_profile_id;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para mensajes de Instagram
DROP TRIGGER IF EXISTS trigger_update_prospect_analysis_with_profile ON instagram_messages;
CREATE TRIGGER trigger_update_prospect_analysis_with_profile
  AFTER INSERT ON instagram_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_prospect_analysis_with_profile();
