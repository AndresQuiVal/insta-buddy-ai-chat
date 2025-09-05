-- Actualizar la función grok_get_stats_with_usernames_filter para usar lógica unificada
-- que coincida exactamente con el frontend y respete el sistema de tachado

CREATE OR REPLACE FUNCTION public.grok_get_stats_with_usernames_filter(p_instagram_user_id text, p_hower_usernames text[])
 RETURNS TABLE(abiertas integer, seguimientos integer, agendados integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Lógica unificada que coincide con el frontend (useProspects.ts)
  RETURN QUERY
  WITH prospect_counts AS (
    SELECT 
      -- ABIERTAS: Solo prospectos que ME RESPONDIERON pero YO NO LES HE CONTESTADO
      -- Y NO están tachados Y están en la lista de Hower
      COUNT(*) FILTER (WHERE p.last_message_from_prospect = true 
        AND p.status = 'esperando_respuesta'
        AND p.last_owner_message_at IS NULL  -- NUNCA les he enviado mensaje
        AND COALESCE(pts.is_completed, false) = false  -- NO tachados
        AND (
          p.username = ANY(p_hower_usernames) OR 
          REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
          p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
        )) as pending_count,
      
      -- SEGUIMIENTOS: Prospectos que YO CONTACTÉ hace >= 1 día (incluye "ayer" + "semana")
      -- Y NO están tachados Y están en la lista de Hower
      COUNT(*) FILTER (WHERE p.last_owner_message_at IS NOT NULL 
        AND p.last_owner_message_at <= (now() - interval '1 day')  -- >= 1 día (no 24 horas)
        AND COALESCE(pts.is_completed, false) = false  -- NO tachados
        AND (
          p.username = ANY(p_hower_usernames) OR 
          REPLACE(p.username, '@', '') = ANY(p_hower_usernames) OR
          p.username = ANY(SELECT '@' || unnest(p_hower_usernames))
        )) as followup_count
    FROM prospects p
    INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
    LEFT JOIN prospect_task_status pts ON iu.instagram_user_id = pts.instagram_user_id 
      AND p.prospect_instagram_id = pts.prospect_sender_id
      AND pts.task_type = 'pending'  -- Respeta el sistema de tachado
    WHERE iu.instagram_user_id = p_instagram_user_id
  )
  SELECT 
    pc.pending_count::integer as abiertas,
    pc.followup_count::integer as seguimientos, 
    20::integer as agendados  -- Placeholder
  FROM prospect_counts pc;
END;
$function$;