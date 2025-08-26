CREATE OR REPLACE FUNCTION public.grok_get_stats(p_instagram_user_id text, p_period text)
 RETURNS TABLE(abiertas integer, seguimientos integer, agendados integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Contar tareas no completadas directamente de prospect_task_status
  RETURN QUERY
  WITH uncompleted_tasks AS (
    SELECT COUNT(*) as task_count
    FROM prospect_task_status pts
    WHERE pts.instagram_user_id = p_instagram_user_id 
      AND (pts.is_completed = false OR pts.is_completed IS NULL)
  )
  SELECT 
    ut.task_count::integer as abiertas,
    ut.task_count::integer as seguimientos,
    20::integer as agendados
  FROM uncompleted_tasks ut;
END;
$function$