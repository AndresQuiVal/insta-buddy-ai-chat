CREATE OR REPLACE FUNCTION public.grok_get_stats(p_instagram_user_id text, p_period text)
 RETURNS TABLE(abiertas integer, seguimientos integer, agendados integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Contar prospectos basándose en la tabla prospects directamente, excluyendo los tachados
  RETURN QUERY
  WITH prospect_data AS (
    SELECT 
      p.prospect_instagram_id,
      p.last_message_from_prospect,
      p.status,
      p.last_owner_message_at,
      COALESCE(pts.is_completed, false) as is_tachado
    FROM prospects p
    INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
    LEFT JOIN prospect_task_status pts ON iu.instagram_user_id = pts.instagram_user_id 
      AND p.prospect_instagram_id = pts.prospect_sender_id
      AND pts.task_type = 'pending'
    WHERE iu.instagram_user_id = p_instagram_user_id
      AND p.status = 'esperando_respuesta'
  ),
  prospect_counts AS (
    SELECT 
      -- URGENTES: prospectos que han respondido (last_message_from_prospect = true) y NO están tachados
      COUNT(*) FILTER (WHERE last_message_from_prospect = true AND is_tachado = false) as pending_count,
      -- SEGUIMIENTOS: prospectos contactados hace más de 24 horas y NO están tachados
      COUNT(*) FILTER (WHERE last_owner_message_at IS NOT NULL 
        AND last_owner_message_at < (now() - interval '24 hours')
        AND is_tachado = false) as followup_count
    FROM prospect_data
  )
  SELECT 
    pc.pending_count::integer as abiertas,
    pc.followup_count::integer as seguimientos,
    20::integer as agendados
  FROM prospect_counts pc;
END;
$function$