-- Agregar campo para registrar fecha del último mensaje del dueño
ALTER TABLE public.prospects 
ADD COLUMN last_owner_message_at timestamp with time zone DEFAULT NULL;

-- Crear índice para optimizar consultas por fecha
CREATE INDEX idx_prospects_last_owner_message_at ON public.prospects(last_owner_message_at);

-- Actualizar función create_or_update_prospect para manejar last_owner_message_at
CREATE OR REPLACE FUNCTION public.create_or_update_prospect(
  p_instagram_user_id uuid, 
  p_prospect_instagram_id text, 
  p_username text, 
  p_profile_picture_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  prospect_id UUID;
BEGIN
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
    p_username,
    p_profile_picture_url,
    now(),
    now(),
    true,
    'esperando_respuesta'
  )
  ON CONFLICT (instagram_user_id, prospect_instagram_id)
  DO UPDATE SET
    username = EXCLUDED.username,
    profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, prospects.profile_picture_url),
    last_message_date = now(),
    updated_at = now()
  RETURNING id INTO prospect_id;
  
  RETURN prospect_id;
END;
$function$;

-- Función para actualizar el timestamp del último mensaje del dueño
CREATE OR REPLACE FUNCTION public.update_prospect_owner_message_timestamp(
  p_instagram_user_id uuid,
  p_prospect_instagram_id text,
  p_is_from_owner boolean
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.prospects 
  SET 
    last_owner_message_at = CASE 
      WHEN p_is_from_owner THEN now() 
      ELSE NULL 
    END,
    updated_at = now()
  WHERE instagram_user_id = p_instagram_user_id 
    AND prospect_instagram_id = p_prospect_instagram_id;
END;
$function$;