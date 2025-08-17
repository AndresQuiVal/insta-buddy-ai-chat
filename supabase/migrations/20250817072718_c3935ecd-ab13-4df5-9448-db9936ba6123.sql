-- Arreglar la función sync_prospect_task_status para NO cambiar a incompleto cuando el prospecto responde después de que ya esté completado
CREATE OR REPLACE FUNCTION public.sync_prospect_task_status(p_instagram_user_id text, p_prospect_sender_id text, p_last_message_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Solo actualizar si no existe o si el nuevo mensaje es 'sent' (no deshacer completados por mensajes recibidos)
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
    -- CRÍTICO: Solo cambiar a completado si es 'sent', pero NO deshacer completados por 'received'
    is_completed = CASE 
      WHEN p_last_message_type = 'sent' THEN true 
      WHEN prospect_task_status.is_completed = true THEN true  -- MANTENER completado si ya lo estaba
      ELSE false 
    END,
    completed_at = CASE 
      WHEN p_last_message_type = 'sent' THEN now() 
      WHEN prospect_task_status.is_completed = true THEN prospect_task_status.completed_at  -- MANTENER fecha original
      ELSE null 
    END,
    last_message_type = p_last_message_type,
    updated_at = now();
END;
$function$