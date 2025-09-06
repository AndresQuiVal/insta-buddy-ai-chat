-- Fix WhatsApp logic to match UI exactly
-- Remove the requirement that prospect must have responded
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

  RETURN QUERY
  WITH prospect_counts AS (
    SELECT 
      -- RESPUESTAS: Solo prospectos que ME RESPONDIERON pero YO NO LES HE CONTESTADO NUNCA
      COALESCE(COUNT(*) FILTER (WHERE p.last_message_from_prospect = true 
        AND p.status = 'esperando_respuesta'
        AND p.last_owner_message_at IS NULL  -- NUNCA les he enviado mensaje
        AND COALESCE(pts.is_completed, false) = false  -- NO tachados
        AND (
          p.username = ANY(p_hower_usernames) OR 
          REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
          p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
        )), 0) as pending_count,
      
      -- SEGUIMIENTOS: MISMA LÓGICA QUE LA UI - Solo verificar que YO les envié mensaje + tiempo
      -- NO importa si me respondieron o no
      COALESCE(COUNT(*) FILTER (WHERE p.last_owner_message_at IS NOT NULL  -- YO les envié mensaje antes
        AND p.last_owner_message_at <= (now() - interval '1 day')  -- Hace >= 1 día desde mi último mensaje
        AND COALESCE(pts.is_completed, false) = false  -- NO tachados
        AND (
          p.username = ANY(p_hower_usernames) OR 
          REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
          p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
        )), 0) as followup_needed_count
    FROM prospects p
    INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
    LEFT JOIN prospect_task_status pts ON iu.instagram_user_id = pts.instagram_user_id 
      AND p.prospect_instagram_id = pts.prospect_sender_id
      AND pts.task_type = 'pending'  -- Respeta el sistema de tachado
    WHERE iu.instagram_user_id = p_instagram_user_id
  )
  SELECT 
    COALESCE(pc.pending_count, 0)::integer as respuestas,
    COALESCE(pc.followup_needed_count, 0)::integer as seguimientos, 
    20::integer as agendados  -- Placeholder
  FROM prospect_counts pc;
END;
$function$