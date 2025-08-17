-- Actualizar la función create_or_update_prospect para incluir nuevos campos
CREATE OR REPLACE FUNCTION public.create_or_update_prospect(
  p_instagram_user_id uuid, 
  p_prospect_instagram_id text, 
  p_username text, 
  p_profile_picture_url text DEFAULT NULL,
  p_biography text DEFAULT NULL,
  p_followers_count integer DEFAULT NULL,
  p_follows_count integer DEFAULT NULL,
  p_media_count integer DEFAULT NULL
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
    biography,
    followers_count,
    follows_count,
    media_count,
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
    p_biography,
    p_followers_count,
    p_follows_count,
    p_media_count,
    now(),
    now(),
    true, -- El primer mensaje es del prospecto
    'esperando_respuesta'
  )
  ON CONFLICT (instagram_user_id, prospect_instagram_id)
  DO UPDATE SET
    username = EXCLUDED.username,
    profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, prospects.profile_picture_url),
    biography = COALESCE(EXCLUDED.biography, prospects.biography),
    followers_count = COALESCE(EXCLUDED.followers_count, prospects.followers_count),
    follows_count = COALESCE(EXCLUDED.follows_count, prospects.follows_count),
    media_count = COALESCE(EXCLUDED.media_count, prospects.media_count),
    last_message_date = now(),
    updated_at = now()
  RETURNING id INTO prospect_id;
  
  RETURN prospect_id;
END;
$function$