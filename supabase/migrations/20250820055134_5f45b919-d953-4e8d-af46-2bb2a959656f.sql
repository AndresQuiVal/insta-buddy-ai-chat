-- Modificar función para incrementar seguimientos solo al contactar prospectos en seguimiento
CREATE OR REPLACE FUNCTION public.increment_daily_prospect_contact(p_instagram_user_id text, p_prospect_sender_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  is_first_contact_today BOOLEAN := FALSE;
  prospect_state TEXT;
  should_increment_seguimientos BOOLEAN := FALSE;
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
    -- Determinar el estado del prospecto para saber si incrementar seguimientos
    SELECT ps.state INTO prospect_state
    FROM public.prospect_states ps
    WHERE ps.instagram_user_id = p_instagram_user_id 
      AND ps.prospect_sender_id = p_prospect_sender_id;
    
    -- Si está en seguimiento (yesterday o week), incrementar seguimientos
    IF prospect_state IN ('yesterday', 'week') THEN
      should_increment_seguimientos := TRUE;
      PERFORM public.grok_increment_stat(p_instagram_user_id, 'seguimientos', 1);
      RAISE NOTICE 'Contactando prospecto en seguimiento (%). Incrementando Seguimientos.', prospect_state;
    ELSE
      -- Siempre incrementar "abiertas" para cualquier primer contacto del día
      PERFORM public.grok_increment_stat(p_instagram_user_id, 'abiertas', 1);
      RAISE NOTICE 'Contactando prospecto en estado %. Incrementando Abiertas.', COALESCE(prospect_state, 'nuevo');
    END IF;
    
    RETURN TRUE; -- Indica que se incrementó alguna métrica
  ELSE
    RAISE NOTICE 'Contacto adicional del día hacia prospecto %. NO incrementando métricas.', p_prospect_sender_id;
    RETURN FALSE; -- Indica que NO se incrementó
  END IF;
END;
$function$;