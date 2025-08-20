-- Sistema GROK: Funciones para manejo de estadísticas persistentes por usuario

-- 1. Función para incrementar estadísticas (GROK_INCREMENT_STAT)
CREATE OR REPLACE FUNCTION public.grok_increment_stat(
  p_instagram_user_id text, 
  p_stat_type text, 
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
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

-- 2. Función para obtener estadísticas por período (GROK_GET_STATS)
CREATE OR REPLACE FUNCTION public.grok_get_stats(
  p_instagram_user_id text,
  p_period text -- 'today', 'yesterday', 'week'
)
RETURNS TABLE(
  abiertas integer,
  seguimientos integer, 
  agendados integer
)
LANGUAGE plpgsql
AS $function$
DECLARE
  start_date date;
  end_date date;
BEGIN
  -- Determinar rango de fechas según el período
  CASE p_period
    WHEN 'today' THEN
      start_date := CURRENT_DATE;
      end_date := CURRENT_DATE;
    WHEN 'yesterday' THEN
      start_date := CURRENT_DATE - INTERVAL '1 day';
      end_date := CURRENT_DATE - INTERVAL '1 day';
    WHEN 'week' THEN
      -- Desde el lunes de esta semana hasta hoy
      start_date := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1;
      end_date := CURRENT_DATE;
    ELSE
      start_date := CURRENT_DATE;
      end_date := CURRENT_DATE;
  END CASE;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(dpm.pending_responses), 0)::integer as abiertas,
    COALESCE(SUM(dpm.follow_ups_done), 0)::integer as seguimientos,
    COALESCE(SUM(dpm.new_prospects_contacted), 0)::integer as agendados
  FROM daily_prospect_metrics dpm
  WHERE dpm.instagram_user_id = p_instagram_user_id
    AND dpm.metric_date >= start_date
    AND dpm.metric_date <= end_date;
END;
$function$;

-- 3. Función para reiniciar estadísticas semanales (GROK_RESET_WEEKLY_STATS)
CREATE OR REPLACE FUNCTION public.grok_reset_weekly_stats(
  p_instagram_user_id text DEFAULT NULL -- Si es NULL, aplica a todos los usuarios
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  reset_count integer := 0;
  week_start_date date;
BEGIN
  -- Calcular inicio de semana (lunes)
  week_start_date := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1;
  
  -- Solo reiniciar si estamos en lunes (inicio de semana)
  IF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
    IF p_instagram_user_id IS NOT NULL THEN
      -- Reiniciar para usuario específico
      UPDATE daily_prospect_metrics 
      SET 
        pending_responses = 0,
        follow_ups_done = 0,
        new_prospects_contacted = 0,
        updated_at = now()
      WHERE instagram_user_id = p_instagram_user_id
        AND metric_date < week_start_date;
        
      GET DIAGNOSTICS reset_count = ROW_COUNT;
    ELSE
      -- Reiniciar para todos los usuarios (para uso por cron job)
      UPDATE daily_prospect_metrics 
      SET 
        pending_responses = 0,
        follow_ups_done = 0,
        new_prospects_contacted = 0,
        updated_at = now()
      WHERE metric_date < week_start_date;
        
      GET DIAGNOSTICS reset_count = ROW_COUNT;
    END IF;
  END IF;
  
  RETURN reset_count;
END;
$function$;