-- Eliminar la función con biografía que está causando conflicto
DROP FUNCTION IF EXISTS public.create_or_update_prospect(uuid, text, text, text, text, integer, integer, integer);

-- Mantener solo la función simple que funcionaba antes
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