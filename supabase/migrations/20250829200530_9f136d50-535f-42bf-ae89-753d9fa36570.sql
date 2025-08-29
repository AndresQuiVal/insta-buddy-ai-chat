-- Crear tabla para trackear búsquedas diarias de prospectos
CREATE TABLE public.daily_prospect_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  search_date DATE NOT NULL DEFAULT CURRENT_DATE,
  search_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para asegurar que solo hay un registro por usuario por día
  UNIQUE(instagram_user_id, search_date)
);

-- Habilitar RLS
ALTER TABLE public.daily_prospect_searches ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own search counts" 
ON public.daily_prospect_searches 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_daily_prospect_searches_updated_at
BEFORE UPDATE ON public.daily_prospect_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para obtener el conteo de búsquedas diarias
CREATE OR REPLACE FUNCTION public.get_daily_search_count(p_instagram_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  search_count INTEGER := 0;
BEGIN
  SELECT COALESCE(search_count, 0) INTO search_count
  FROM public.daily_prospect_searches
  WHERE instagram_user_id = p_instagram_user_id
    AND search_date = CURRENT_DATE;
  
  RETURN search_count;
END;
$$;

-- Función para incrementar el conteo de búsquedas diarias
CREATE OR REPLACE FUNCTION public.increment_daily_search_count(p_instagram_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_count INTEGER;
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
  RETURNING search_count INTO new_count;
  
  RETURN new_count;
END;
$$;