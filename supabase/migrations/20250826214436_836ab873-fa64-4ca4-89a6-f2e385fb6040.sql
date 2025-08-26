-- 1. LIMPIAR DATOS CORRUPTOS EXISTENTES

-- Eliminar registros relacionados de prospectos con usernames inválidos
DELETE FROM public.daily_prospect_responses 
WHERE prospect_sender_id IN (
  SELECT p.prospect_instagram_id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

DELETE FROM public.daily_prospect_contacts 
WHERE prospect_sender_id IN (
  SELECT p.prospect_instagram_id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

DELETE FROM public.prospect_last_activity 
WHERE prospect_id IN (
  SELECT p.prospect_instagram_id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

DELETE FROM public.prospect_task_status 
WHERE prospect_sender_id IN (
  SELECT p.prospect_instagram_id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

DELETE FROM public.prospect_states 
WHERE prospect_sender_id IN (
  SELECT p.prospect_instagram_id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

DELETE FROM public.prospect_analysis 
WHERE sender_id IN (
  SELECT p.prospect_instagram_id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

DELETE FROM public.prospect_messages 
WHERE prospect_id IN (
  SELECT p.id 
  FROM public.prospects p 
  WHERE p.username LIKE 'user_%' 
     OR p.username LIKE 'prospect_%' 
     OR p.username = '' 
     OR p.username IS NULL
);

-- Eliminar los prospectos con usernames inválidos
DELETE FROM public.prospects 
WHERE username LIKE 'user_%' 
   OR username LIKE 'prospect_%' 
   OR username = '' 
   OR username IS NULL;

-- 2. CREAR FUNCIÓN DE VALIDACIÓN
CREATE OR REPLACE FUNCTION public.validate_prospect_username()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar que el username no sea nulo o vacío
  IF NEW.username IS NULL OR trim(NEW.username) = '' THEN
    RAISE EXCEPTION 'Username cannot be null or empty';
  END IF;
  
  -- Verificar que no empiece con patrones genéricos
  IF NEW.username LIKE 'user_%' OR NEW.username LIKE 'prospect_%' THEN
    RAISE EXCEPTION 'Username cannot start with generic patterns like user_ or prospect_';
  END IF;
  
  -- Verificar que tenga al menos 1 caracter válido
  IF length(trim(NEW.username)) < 1 THEN
    RAISE EXCEPTION 'Username must have at least 1 character';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CREAR TRIGGER PARA VALIDAR USERNAME
DROP TRIGGER IF EXISTS validate_prospect_username_trigger ON public.prospects;
CREATE TRIGGER validate_prospect_username_trigger
  BEFORE INSERT OR UPDATE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_prospect_username();

-- 4. ACTUALIZAR FUNCIÓN create_or_update_prospect CON VALIDACIÓN
CREATE OR REPLACE FUNCTION public.create_or_update_prospect(
  p_instagram_user_id uuid, 
  p_prospect_instagram_id text, 
  p_username text, 
  p_profile_picture_url text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  prospect_id UUID;
BEGIN
  -- Validar username antes de insertar
  IF p_username IS NULL OR trim(p_username) = '' THEN
    RAISE EXCEPTION 'Username cannot be null or empty';
  END IF;
  
  IF p_username LIKE 'user_%' OR p_username LIKE 'prospect_%' THEN
    RAISE EXCEPTION 'Username cannot start with generic patterns like user_ or prospect_';
  END IF;
  
  -- Insertar o actualizar prospecto
  INSERT INTO public.prospects (
    instagram_user_id,
    prospect_instagram_id,
    username,
    profile_picture_url,
    first_contact_date,
    last_message_date,
    last_message_from_prospect,
    status
  )
  VALUES (
    p_instagram_user_id,
    p_prospect_instagram_id,
    trim(p_username), -- Limpiar espacios
    p_profile_picture_url,
    now(),
    now(),
    true,
    'esperando_respuesta'
  )
  ON CONFLICT (instagram_user_id, prospect_instagram_id)
  DO UPDATE SET
    username = trim(EXCLUDED.username),
    profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, prospects.profile_picture_url),
    last_message_date = now(),
    updated_at = now()
  RETURNING id INTO prospect_id;
  
  RETURN prospect_id;
END;
$function$;