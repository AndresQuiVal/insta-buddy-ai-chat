-- Crear función híbrida que filtra por Hower Y respeta períodos
CREATE OR REPLACE FUNCTION public.grok_get_stats_with_hower_filter(
  p_instagram_user_id text, 
  p_period text,
  p_hower_usernames text[]
)
RETURNS TABLE(respuestas integer, seguimientos integer, agendados integer)
LANGUAGE plpgsql
AS $function$
DECLARE
  start_date DATE;
  end_date DATE;
BEGIN
  -- Return default values if no usernames provided
  IF p_hower_usernames IS NULL OR array_length(p_hower_usernames, 1) IS NULL THEN
    RETURN QUERY SELECT 0::integer, 0::integer, 20::integer;
    RETURN;
  END IF;

  -- Configurar fechas según el período
  CASE p_period
    WHEN 'today' THEN
      start_date := CURRENT_DATE;
      end_date := CURRENT_DATE;
    WHEN 'yesterday' THEN
      start_date := CURRENT_DATE - INTERVAL '1 day';
      end_date := CURRENT_DATE - INTERVAL '1 day';
    WHEN 'week' THEN
      -- Semana actual (lunes a domingo)
      start_date := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1;
      end_date := CURRENT_DATE;
    ELSE
      -- Por defecto hoy
      start_date := CURRENT_DATE;
      end_date := CURRENT_DATE;
  END CASE;

  RETURN QUERY
  WITH prospect_counts AS (
    -- RESPUESTAS: Contar respuestas únicas de prospectos por período
    -- Solo primera respuesta por prospecto por día Y que estén en lista de Hower
    SELECT 
      COUNT(DISTINCT dpr.prospect_sender_id) FILTER (
        WHERE dpr.response_date >= start_date 
        AND dpr.response_date <= end_date
        AND EXISTS (
          SELECT 1 FROM prospects p
          INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
          WHERE iu.instagram_user_id = p_instagram_user_id
          AND p.prospect_instagram_id = dpr.prospect_sender_id
          AND (
            p.username = ANY(p_hower_usernames) OR 
            REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
            p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
          )
        )
      ) as responses_count,
      
      -- SEGUIMIENTOS: Contar contactos únicos a prospectos en seguimiento por período  
      -- Solo primer contacto por prospecto por día, y que estén en seguimiento (>=24h desde último mensaje)
      -- Y que estén en lista de Hower
      COUNT(DISTINCT dpc.prospect_sender_id) FILTER (
        WHERE dpc.contact_date >= start_date 
        AND dpc.contact_date <= end_date
        AND EXISTS (
          SELECT 1 FROM prospects p
          INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
          WHERE iu.instagram_user_id = p_instagram_user_id
          AND p.prospect_instagram_id = dpc.prospect_sender_id
          AND p.last_owner_message_at IS NOT NULL
          AND p.last_owner_message_at <= (dpc.first_contact_at - interval '24 hours')
          AND COALESCE((
            SELECT pts.is_completed 
            FROM prospect_task_status pts 
            WHERE pts.instagram_user_id = p_instagram_user_id 
            AND pts.prospect_sender_id = dpc.prospect_sender_id 
            AND pts.task_type = 'pending'
          ), false) = false
          AND (
            p.username = ANY(p_hower_usernames) OR 
            REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
            p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
          )
        )
      ) as followup_count
    FROM daily_prospect_responses dpr
    FULL OUTER JOIN daily_prospect_contacts dpc ON dpr.instagram_user_id = dpc.instagram_user_id
    WHERE COALESCE(dpr.instagram_user_id, dpc.instagram_user_id) = p_instagram_user_id
  )
  SELECT 
    COALESCE(pc.responses_count, 0)::integer as respuestas,
    COALESCE(pc.followup_count, 0)::integer as seguimientos,
    20::integer as agendados  -- Placeholder
  FROM prospect_counts pc;
END;
$function$;
