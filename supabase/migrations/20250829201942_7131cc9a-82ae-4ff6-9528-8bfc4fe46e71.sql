-- Fix ambiguous column reference in get_daily_search_count function
CREATE OR REPLACE FUNCTION public.get_daily_search_count(p_instagram_user_id text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_search_count INTEGER := 0;
BEGIN
  SELECT COALESCE(dps.search_count, 0) INTO current_search_count
  FROM public.daily_prospect_searches dps
  WHERE dps.instagram_user_id = p_instagram_user_id
    AND dps.search_date = CURRENT_DATE;
  
  RETURN current_search_count;
END;
$function$;

-- Fix ambiguous column reference in increment_daily_search_count function
CREATE OR REPLACE FUNCTION public.increment_daily_search_count(p_instagram_user_id text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_search_count INTEGER;
BEGIN
  INSERT INTO public.daily_prospect_searches (
    instagram_user_id,
    search_date,
    search_count
  )
  VALUES (
    p_instagram_user_id,
    CURRENT_DATE,
    1
  )
  ON CONFLICT (instagram_user_id, search_date)
  DO UPDATE SET
    search_count = daily_prospect_searches.search_count + 1,
    updated_at = now()
  RETURNING search_count INTO new_search_count;
  
  RETURN new_search_count;
END;
$function$;