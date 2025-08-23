-- Función para sincronizar last_owner_message_at basado en mensajes enviados
CREATE OR REPLACE FUNCTION public.sync_prospect_last_owner_message_at()
RETURNS TABLE(updated_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Actualizar last_owner_message_at para prospectos basado en el último mensaje enviado
  WITH last_sent_messages AS (
    SELECT 
      p.id as prospect_id,
      MAX(im.timestamp) as last_sent_at
    FROM public.prospects p
    INNER JOIN public.instagram_users iu ON p.instagram_user_id = iu.id
    INNER JOIN public.instagram_messages im ON iu.id = im.instagram_user_id 
      AND im.sender_id = iu.instagram_user_id 
      AND im.recipient_id = p.prospect_instagram_id
      AND im.message_type = 'sent'
    GROUP BY p.id
  )
  UPDATE public.prospects 
  SET 
    last_owner_message_at = lsm.last_sent_at,
    updated_at = now()
  FROM last_sent_messages lsm
  WHERE prospects.id = lsm.prospect_id
    AND (prospects.last_owner_message_at IS NULL OR prospects.last_owner_message_at != lsm.last_sent_at);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT updated_count;
END;
$function$;