-- Corregir la función register_daily_prospect_response para que solo incremente 
-- las "Abiertas" la primera vez que un prospecto responde en un día

CREATE OR REPLACE FUNCTION public.register_daily_prospect_response(p_instagram_user_id text, p_prospect_sender_id text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  is_first_response_today BOOLEAN := FALSE;
BEGIN
  -- Verificar si es la primera respuesta del prospecto hoy
  SELECT NOT EXISTS (
    SELECT 1 FROM public.daily_prospect_responses 
    WHERE instagram_user_id = p_instagram_user_id 
      AND prospect_sender_id = p_prospect_sender_id 
      AND response_date = CURRENT_DATE
  ) INTO is_first_response_today;

  -- Insertar o actualizar el registro de respuesta diaria
  INSERT INTO public.daily_prospect_responses (
    instagram_user_id,
    prospect_sender_id,
    response_date,
    first_response_at,
    message_count
  )
  VALUES (
    p_instagram_user_id,
    p_prospect_sender_id,
    CURRENT_DATE,
    now(),
    1
  )
  ON CONFLICT (instagram_user_id, prospect_sender_id, response_date)
  DO UPDATE SET
    message_count = daily_prospect_responses.message_count + 1,
    updated_at = now();
    
  -- Solo incrementar "Abiertas" si es la primera respuesta del día
  IF is_first_response_today THEN
    PERFORM public.update_daily_metric(p_instagram_user_id, 'responses_obtained', 1);
    
    -- Log para debug
    INSERT INTO daily_prospect_metrics (instagram_user_id, metric_date, responses_obtained)
    VALUES (p_instagram_user_id, CURRENT_DATE, 0)
    ON CONFLICT (instagram_user_id, metric_date) DO NOTHING;
    
    -- Agregar un log para confirmar que se incrementó
    RAISE NOTICE 'Primera respuesta del día para prospecto % del usuario %. Incrementando Abiertas.', p_prospect_sender_id, p_instagram_user_id;
  ELSE
    -- Log para debug cuando NO se incrementa
    RAISE NOTICE 'Respuesta adicional del día para prospecto % del usuario %. NO incrementando Abiertas.', p_prospect_sender_id, p_instagram_user_id;
  END IF;
END;
$function$