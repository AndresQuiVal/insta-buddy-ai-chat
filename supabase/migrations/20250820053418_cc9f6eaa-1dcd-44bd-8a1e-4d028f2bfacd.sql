-- Crear función para incrementar "abiertas" solo una vez por día por prospecto
CREATE OR REPLACE FUNCTION public.increment_daily_prospect_contact(p_instagram_user_id text, p_prospect_sender_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  is_first_contact_today BOOLEAN := FALSE;
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
    
  -- Solo incrementar "abiertas" si es el primer contacto del día
  IF is_first_contact_today THEN
    PERFORM public.grok_increment_stat(p_instagram_user_id, 'abiertas', 1);
    RAISE NOTICE 'Primer contacto del día hacia prospecto % del usuario %. Incrementando Abiertas.', p_prospect_sender_id, p_instagram_user_id;
    RETURN TRUE; -- Indica que se incrementó
  ELSE
    RAISE NOTICE 'Contacto adicional del día hacia prospecto % del usuario %. NO incrementando Abiertas.', p_prospect_sender_id, p_instagram_user_id;
    RETURN FALSE; -- Indica que NO se incrementó
  END IF;
END;
$function$;

-- Crear tabla para trackear contactos diarios hacia prospectos
CREATE TABLE IF NOT EXISTS public.daily_prospect_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  prospect_sender_id TEXT NOT NULL,
  contact_date DATE NOT NULL DEFAULT CURRENT_DATE,
  first_contact_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contact_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id, prospect_sender_id, contact_date)
);

-- Habilitar RLS
ALTER TABLE public.daily_prospect_contacts ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean solo sus contactos
CREATE POLICY "Users can view their own daily contacts" 
ON public.daily_prospect_contacts 
FOR SELECT 
USING (instagram_user_id IN ( 
  SELECT instagram_users.instagram_user_id
  FROM instagram_users
  WHERE instagram_users.is_active = true
));

-- Política para insertar contactos
CREATE POLICY "System can insert daily contacts" 
ON public.daily_prospect_contacts 
FOR INSERT 
WITH CHECK (true);

-- Política para actualizar contactos
CREATE POLICY "System can update daily contacts" 
ON public.daily_prospect_contacts 
FOR UPDATE 
USING (true);