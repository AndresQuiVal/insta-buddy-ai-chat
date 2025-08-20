-- Corregir función para usar la misma lógica que el frontend para determinar seguimiento
CREATE OR REPLACE FUNCTION public.increment_daily_prospect_contact(p_instagram_user_id text, p_prospect_sender_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  is_first_contact_today BOOLEAN := FALSE;
  last_owner_message_at TIMESTAMP WITH TIME ZONE;
  hours_since_last_message NUMERIC;
  is_seguimiento BOOLEAN := FALSE;
BEGIN
  -- Verificar si es el primer contacto del día hacia este prospecto
  SELECT NOT EXISTS (
    SELECT 1 FROM public.daily_prospect_contacts 
    WHERE instagram_user_id = p_instagram_user_id 
      AND prospect_sender_id = p_prospect_sender_id 
      AND contact_date = CURRENT_DATE
  ) INTO is_first_contact_today;

  -- Insertar o actualizar el registro de contacto diario
  INSERT INTO public.daily_prospect_contacts (
    instagram_user_id,
    prospect_sender_id,
    contact_date,
    first_contact_at,
    contact_count
  )
  VALUES (
    p_instagram_user_id,
    p_prospect_sender_id,
    CURRENT_DATE,
    now(),
    1
  )
  ON CONFLICT (instagram_user_id, prospect_sender_id, contact_date)
  DO UPDATE SET
    contact_count = daily_prospect_contacts.contact_count + 1,
    updated_at = now();
    
  -- Solo incrementar métricas si es el primer contacto del día
  IF is_first_contact_today THEN
    -- Obtener el último mensaje del owner (misma lógica que el frontend)
    SELECT p.last_owner_message_at INTO last_owner_message_at
    FROM public.prospects p
    INNER JOIN public.instagram_users iu ON p.instagram_user_id = iu.id
    WHERE iu.instagram_user_id = p_instagram_user_id 
      AND p.prospect_instagram_id = p_prospect_sender_id;
    
    -- Calcular horas desde último mensaje del owner
    IF last_owner_message_at IS NOT NULL THEN
      hours_since_last_message := EXTRACT(EPOCH FROM (now() - last_owner_message_at)) / 3600;
      
      -- Determinar si está en seguimiento (más de 24 horas desde último mensaje)
      IF hours_since_last_message >= 24 THEN
        is_seguimiento := TRUE;
      END IF;
    END IF;
    
    -- Incrementar métrica correspondiente
    IF is_seguimiento THEN
      PERFORM public.grok_increment_stat(p_instagram_user_id, 'seguimientos', 1);
      RAISE NOTICE 'Contactando prospecto en seguimiento (%.2f horas). Incrementando Seguimientos.', hours_since_last_message;
    ELSE
      PERFORM public.grok_increment_stat(p_instagram_user_id, 'abiertas', 1);
      RAISE NOTICE 'Contactando prospecto nuevo o reciente (%.2f horas). Incrementando Abiertas.', COALESCE(hours_since_last_message, 0);
    END IF;
    
    RETURN TRUE;
  ELSE
    RAISE NOTICE 'Contacto adicional del día hacia prospecto %. NO incrementando métricas.', p_prospect_sender_id;
    RETURN FALSE;
  END IF;
END;
$function$;