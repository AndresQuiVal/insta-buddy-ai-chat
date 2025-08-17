-- Actualizar la función para manejar correctamente el tachado/destachado
CREATE OR REPLACE FUNCTION public.sync_prospect_task_status(p_instagram_user_id text, p_prospect_sender_id text, p_last_message_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.prospect_task_status (
    instagram_user_id,
    prospect_sender_id,
    task_type,
    is_completed,
    completed_at,
    last_message_type,
    updated_at
  ) VALUES (
    p_instagram_user_id,
    p_prospect_sender_id,
    'pending',
    CASE WHEN p_last_message_type = 'sent' THEN true ELSE false END,
    CASE WHEN p_last_message_type = 'sent' THEN now() ELSE null END,
    p_last_message_type,
    now()
  )
  ON CONFLICT (instagram_user_id, prospect_sender_id, task_type)
  DO UPDATE SET
    -- Si envié mensaje = completado (tachado)
    -- Si recibí mensaje = no completado (destachado)
    is_completed = CASE WHEN p_last_message_type = 'sent' THEN true ELSE false END,
    completed_at = CASE WHEN p_last_message_type = 'sent' THEN now() ELSE null END,
    last_message_type = p_last_message_type,
    updated_at = now();
END;
$function$