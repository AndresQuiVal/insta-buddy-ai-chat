-- Fix the grok_get_stats_with_usernames_filter function to avoid returning undefined
-- Ensure it always returns a number for respuestas (abiertas) field

CREATE OR REPLACE FUNCTION public.grok_get_stats_with_usernames_filter(p_instagram_user_id text, p_hower_usernames text[])
 RETURNS TABLE(respuestas integer, seguimientos integer, agendados integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Return default values if no usernames provided
  IF p_hower_usernames IS NULL OR array_length(p_hower_usernames, 1) IS NULL THEN
    RETURN QUERY SELECT 0::integer, 0::integer, 20::integer;
    RETURN;
  END IF;

  -- Lógica unificada que coincide con el frontend (useProspects.ts)
  RETURN QUERY
  WITH prospect_counts AS (
    SELECT 
      -- RESPUESTAS: Solo prospectos que ME RESPONDIERON pero YO NO LES HE CONTESTADO
      -- Y NO están tachados Y están en la lista de Hower
      COALESCE(COUNT(*) FILTER (WHERE p.last_message_from_prospect = true 
        AND p.status = 'esperando_respuesta'
        AND p.last_owner_message_at IS NULL  -- NUNCA les he enviado mensaje
        AND COALESCE(pts.is_completed, false) = false  -- NO tachados
        AND (
          p.username = ANY(p_hower_usernames) OR 
          REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
          p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
        )), 0) as pending_count,
      
      -- SEGUIMIENTOS: Usar métricas acumulativas de daily_prospect_metrics
      -- En lugar de contar prospectos, usar el contador real de seguimientos hechos hoy
      COALESCE((
        SELECT dpm.follow_ups_done 
        FROM daily_prospect_metrics dpm 
        WHERE dpm.instagram_user_id = p_instagram_user_id 
        AND dpm.metric_date = CURRENT_DATE
      ), 0) as followup_count
    FROM prospects p
    INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
    LEFT JOIN prospect_task_status pts ON iu.instagram_user_id = pts.instagram_user_id 
      AND p.prospect_instagram_id = pts.prospect_sender_id
      AND pts.task_type = 'pending'  -- Respeta el sistema de tachado
    WHERE iu.instagram_user_id = p_instagram_user_id
  )
  SELECT 
    COALESCE(pc.pending_count, 0)::integer as respuestas,
    COALESCE(pc.followup_count, 0)::integer as seguimientos, 
    20::integer as agendados  -- Placeholder
  FROM prospect_counts pc;
END;
$function$;