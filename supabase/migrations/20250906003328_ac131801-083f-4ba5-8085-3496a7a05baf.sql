-- Recrear función grok_increment_stat con SECURITY DEFINER
DROP FUNCTION IF EXISTS public.grok_increment_stat(text, text, integer);

CREATE OR REPLACE FUNCTION public.grok_increment_stat(p_instagram_user_id text, p_stat_type text, p_increment integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- 🔥 CRÍTICO: Ejecutar con permisos de superusuario
AS $function$
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
    CASE WHEN p_stat_type = 'abiertas' THEN p_increment ELSE 0 END,
    CASE WHEN p_stat_type = 'seguimientos' THEN p_increment ELSE 0 END,
    CASE WHEN p_stat_type = 'agendados' THEN p_increment ELSE 0 END,
    CASE WHEN p_stat_type = 'responses_obtained' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (instagram_user_id, metric_date)
  DO UPDATE SET
    pending_responses = CASE WHEN p_stat_type = 'abiertas' 
      THEN daily_prospect_metrics.pending_responses + p_increment 
      ELSE daily_prospect_metrics.pending_responses END,
    follow_ups_done = CASE WHEN p_stat_type = 'seguimientos' 
      THEN daily_prospect_metrics.follow_ups_done + p_increment 
      ELSE daily_prospect_metrics.follow_ups_done END,
    new_prospects_contacted = CASE WHEN p_stat_type = 'agendados' 
      THEN daily_prospect_metrics.new_prospects_contacted + p_increment 
      ELSE daily_prospect_metrics.new_prospects_contacted END,
    responses_obtained = CASE WHEN p_stat_type = 'responses_obtained' 
      THEN daily_prospect_metrics.responses_obtained + p_increment 
      ELSE daily_prospect_metrics.responses_obtained END,
    updated_at = now();
END;
$function$;