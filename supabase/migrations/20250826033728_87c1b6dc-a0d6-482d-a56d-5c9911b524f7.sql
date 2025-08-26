CREATE OR REPLACE FUNCTION public.grok_get_stats(p_instagram_user_id text, p_period text)
 RETURNS TABLE(abiertas integer, seguimientos integer, agendados integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Contar prospectos basándose en la tabla prospects directamente, excluyendo los tachados
  RETURN QUERY
  WITH prospect_counts AS (
    SELECT 
      -- URGENTES: prospectos que han respondido y están esperando respuesta, NO tachados
      COUNT(*) FILTER (WHERE p.last_message_from_prospect = true 
        AND p.status = 'esperando_respuesta'
        AND (pts.is_completed IS NULL OR pts.is_completed = false)) as pending_count,
      -- SEGUIMIENTOS: prospectos que han sido contactados pero hace más de 24 horas, NO tachados
      COUNT(*) FILTER (WHERE p.last_owner_message_at IS NOT NULL 
        AND p.last_owner_message_at < (now() - interval '24 hours')
        AND p.status = 'esperando_respuesta'
        AND (pts.is_completed IS NULL OR pts.is_completed = false)) as followup_count
    FROM prospects p
    INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
    LEFT JOIN prospect_task_status pts ON iu.instagram_user_id = pts.instagram_user_id 
      AND p.prospect_instagram_id = pts.prospect_sender_id
      AND pts.task_type = 'pending'
    WHERE iu.instagram_user_id = p_instagram_user_id
  )
  SELECT 
    pc.pending_count::integer as abiertas,
    pc.followup_count::integer as seguimientos,
    20::integer as agendados
  FROM prospect_counts pc;
END;
$function$