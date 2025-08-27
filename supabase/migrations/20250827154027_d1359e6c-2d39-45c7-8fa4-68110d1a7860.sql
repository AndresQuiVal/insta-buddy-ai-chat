-- Eliminar la función problemática que usa http()
DROP FUNCTION IF EXISTS public.grok_get_stats_filtered_by_hower_users(text, text);

-- Crear nueva función que acepta usernames como parámetro
CREATE OR REPLACE FUNCTION public.grok_get_stats_with_usernames_filter(
  p_instagram_user_id text, 
  p_hower_usernames text[]
)
RETURNS TABLE(abiertas integer, seguimientos integer, agendados integer)
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Contar prospectos basándose en la lógica correcta del usuario
  -- pero filtrando solo por usuarios que están en la lista de Hower
  RETURN QUERY
  WITH prospect_counts AS (
    SELECT 
      -- URGENTES/ABIERTAS: prospectos que han respondido y NO hay timestamp de último mensaje del dueño 
      -- O menos de 24h desde último mensaje del dueño, y NO tachados, Y están en Hower
      COUNT(*) FILTER (WHERE p.last_message_from_prospect = true 
        AND p.status = 'esperando_respuesta'
        AND (p.last_owner_message_at IS NULL OR p.last_owner_message_at > (now() - interval '24 hours'))
        AND COALESCE(pts.is_completed, false) = false
        AND p.username = ANY(p_hower_usernames)) as pending_count,
      
      -- SEGUIMIENTOS: prospectos contactados hace más de 1 día (24 horas) y NO tachados, Y están en Hower
      COUNT(*) FILTER (WHERE p.last_owner_message_at IS NOT NULL 
        AND p.last_owner_message_at <= (now() - interval '24 hours')
        AND COALESCE(pts.is_completed, false) = false
        AND p.username = ANY(p_hower_usernames)) as followup_count
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
$function$;