-- Crear tabla de perfiles de Hower Lite
CREATE TABLE public.hower_lite_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+52',
  niche TEXT NOT NULL,
  niche_detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de configuraciones de notificaciones de WhatsApp
CREATE TABLE public.whatsapp_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notification_time TIME NOT NULL DEFAULT '09:00:00',
  notification_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- 0=domingo, 1=lunes, etc.
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de métricas diarias de prospectos
CREATE TABLE public.daily_prospect_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  pending_responses INTEGER NOT NULL DEFAULT 0,
  follow_ups_done INTEGER NOT NULL DEFAULT 0,
  new_prospects_contacted INTEGER NOT NULL DEFAULT 0,
  responses_obtained INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id, metric_date)
);

-- Crear tabla de estados de prospectos
CREATE TABLE public.prospect_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  prospect_username TEXT NOT NULL,
  prospect_sender_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('pending_response', 'no_response_1day', 'no_response_7days', 'responded')),
  last_client_message_at TIMESTAMP WITH TIME ZONE,
  last_prospect_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id, prospect_sender_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.hower_lite_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prospect_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_states ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para hower_lite_profiles
CREATE POLICY "Users can manage their own Hower Lite profile" 
ON public.hower_lite_profiles 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id FROM instagram_users WHERE is_active = true
));

-- Políticas RLS para whatsapp_notification_settings
CREATE POLICY "Users can manage their own WhatsApp settings" 
ON public.whatsapp_notification_settings 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id FROM instagram_users WHERE is_active = true
));

-- Políticas RLS para daily_prospect_metrics
CREATE POLICY "Users can view their own metrics" 
ON public.daily_prospect_metrics 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id FROM instagram_users WHERE is_active = true
));

-- Políticas RLS para prospect_states
CREATE POLICY "Users can manage their own prospect states" 
ON public.prospect_states 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id FROM instagram_users WHERE is_active = true
));

-- Función para actualizar métricas diarias
CREATE OR REPLACE FUNCTION public.update_daily_metric(
  p_instagram_user_id TEXT,
  p_metric_type TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_prospect_metrics (
    instagram_user_id,
    metric_date,
    pending_responses,
    follow_ups_done,
    new_prospects_contacted,
    responses_obtained
  )
  VALUES (
    p_instagram_user_id,
    CURRENT_DATE,
    CASE WHEN p_metric_type = 'pending_responses' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric_type = 'follow_ups_done' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric_type = 'new_prospects_contacted' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric_type = 'responses_obtained' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (instagram_user_id, metric_date)
  DO UPDATE SET
    pending_responses = CASE WHEN p_metric_type = 'pending_responses' 
      THEN daily_prospect_metrics.pending_responses + p_increment 
      ELSE daily_prospect_metrics.pending_responses END,
    follow_ups_done = CASE WHEN p_metric_type = 'follow_ups_done' 
      THEN daily_prospect_metrics.follow_ups_done + p_increment 
      ELSE daily_prospect_metrics.follow_ups_done END,
    new_prospects_contacted = CASE WHEN p_metric_type = 'new_prospects_contacted' 
      THEN daily_prospect_metrics.new_prospects_contacted + p_increment 
      ELSE daily_prospect_metrics.new_prospects_contacted END,
    responses_obtained = CASE WHEN p_metric_type = 'responses_obtained' 
      THEN daily_prospect_metrics.responses_obtained + p_increment 
      ELSE daily_prospect_metrics.responses_obtained END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estado de prospecto
CREATE OR REPLACE FUNCTION public.update_prospect_state(
  p_instagram_user_id TEXT,
  p_prospect_username TEXT,
  p_prospect_sender_id TEXT,
  p_state TEXT,
  p_last_client_message_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_last_prospect_message_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.prospect_states (
    instagram_user_id,
    prospect_username,
    prospect_sender_id,
    state,
    last_client_message_at,
    last_prospect_message_at
  )
  VALUES (
    p_instagram_user_id,
    p_prospect_username,
    p_prospect_sender_id,
    p_state,
    p_last_client_message_at,
    p_last_prospect_message_at
  )
  ON CONFLICT (instagram_user_id, prospect_sender_id)
  DO UPDATE SET
    prospect_username = EXCLUDED.prospect_username,
    state = EXCLUDED.state,
    last_client_message_at = COALESCE(EXCLUDED.last_client_message_at, prospect_states.last_client_message_at),
    last_prospect_message_at = COALESCE(EXCLUDED.last_prospect_message_at, prospect_states.last_prospect_message_at),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_hower_lite_profiles_updated_at
  BEFORE UPDATE ON public.hower_lite_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_notification_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_prospect_metrics_updated_at
  BEFORE UPDATE ON public.daily_prospect_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospect_states_updated_at
  BEFORE UPDATE ON public.prospect_states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();