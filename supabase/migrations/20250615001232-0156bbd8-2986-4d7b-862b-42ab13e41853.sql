
-- Crear función para calcular métricas avanzadas filtradas por instagram_user_id
CREATE OR REPLACE FUNCTION public.calculate_advanced_metrics_by_instagram_user(user_instagram_id text)
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
  last_message_date timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
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
    FROM instagram_messages im
    INNER JOIN instagram_users iu ON im.instagram_user_id = iu.id
    WHERE iu.instagram_user_id = user_instagram_id
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
    last_sent
  FROM metrics;
END;
$$;

-- Agregar columna instagram_user_id_ref a autoresponder_messages para filtrar por usuario
ALTER TABLE public.autoresponder_messages 
ADD COLUMN IF NOT EXISTS instagram_user_id_ref text;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_autoresponder_messages_instagram_user_id 
ON public.autoresponder_messages(instagram_user_id_ref);

-- Agregar columna instagram_user_id_ref a ideal_client_traits para filtrar por usuario  
ALTER TABLE public.ideal_client_traits
ADD COLUMN IF NOT EXISTS instagram_user_id_ref text;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ideal_client_traits_instagram_user_id 
ON public.ideal_client_traits(instagram_user_id_ref);
