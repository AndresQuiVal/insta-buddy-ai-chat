CREATE OR REPLACE FUNCTION public.grok_get_stats(p_instagram_user_id text, p_period text)
 RETURNS TABLE(abiertas integer, seguimientos integer, agendados integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Contar prospectos por estado real de la UI
  RETURN QUERY
  WITH prospect_counts AS (
    SELECT 
      COUNT(*) FILTER (WHERE ps.state = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE ps.state IN ('yesterday', 'week')) as followup_count
    FROM prospect_states ps
    WHERE ps.instagram_user_id = p_instagram_user_id
  )
  SELECT 
    pc.pending_count::integer as abiertas,
    pc.followup_count::integer as seguimientos,
    20::integer as agendados
  FROM prospect_counts pc;
END;
$function$