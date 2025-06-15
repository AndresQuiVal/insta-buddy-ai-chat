
-- Tabla para almacenar prospectos individuales
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id UUID REFERENCES public.instagram_users(id) ON DELETE CASCADE,
  prospect_instagram_id TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_picture_url TEXT,
  first_contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_from_prospect BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'esperando_respuesta' CHECK (status IN ('esperando_respuesta', 'en_seguimiento')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id, prospect_instagram_id)
);

-- Tabla para almacenar mensajes de conversaciones con prospectos
CREATE TABLE public.prospect_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
  message_instagram_id TEXT NOT NULL,
  message_text TEXT,
  is_from_prospect BOOLEAN NOT NULL,
  message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  message_type TEXT DEFAULT 'text',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_instagram_id)
);

-- Agregar campo de OpenAI API Key a instagram_users si no existe
ALTER TABLE public.instagram_users 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para prospects (usando instagram_user_id)
CREATE POLICY "Users can view their own prospects" 
  ON public.prospects 
  FOR ALL
  USING (instagram_user_id IN (
    SELECT id FROM public.instagram_users 
    WHERE instagram_user_id = current_setting('app.current_instagram_user_id', true)
  ));

-- Políticas RLS para prospect_messages (a través de prospects)
CREATE POLICY "Users can view their own prospect messages" 
  ON public.prospect_messages 
  FOR ALL
  USING (prospect_id IN (
    SELECT p.id FROM public.prospects p
    INNER JOIN public.instagram_users iu ON p.instagram_user_id = iu.id
    WHERE iu.instagram_user_id = current_setting('app.current_instagram_user_id', true)
  ));

-- Función para crear o actualizar prospecto cuando el autoresponder responde
CREATE OR REPLACE FUNCTION public.create_or_update_prospect(
  p_instagram_user_id UUID,
  p_prospect_instagram_id TEXT,
  p_username TEXT,
  p_profile_picture_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
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
    true, -- El primer mensaje es del prospecto
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
$$;

-- Función para agregar mensaje a la conversación del prospecto
CREATE OR REPLACE FUNCTION public.add_prospect_message(
  p_prospect_id UUID,
  p_message_instagram_id TEXT,
  p_message_text TEXT,
  p_is_from_prospect BOOLEAN,
  p_message_timestamp TIMESTAMP WITH TIME ZONE,
  p_message_type TEXT DEFAULT 'text',
  p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO public.prospect_messages (
    prospect_id,
    message_instagram_id,
    message_text,
    is_from_prospect,
    message_timestamp,
    message_type,
    raw_data
  )
  VALUES (
    p_prospect_id,
    p_message_instagram_id,
    p_message_text,
    p_is_from_prospect,
    p_message_timestamp,
    p_message_type,
    p_raw_data
  )
  ON CONFLICT (message_instagram_id)
  DO UPDATE SET
    message_text = EXCLUDED.message_text,
    raw_data = EXCLUDED.raw_data
  RETURNING id INTO message_id;
  
  -- Actualizar el estado del prospecto basado en quién envió el último mensaje
  UPDATE public.prospects 
  SET 
    last_message_date = p_message_timestamp,
    last_message_from_prospect = p_is_from_prospect,
    status = CASE 
      WHEN p_is_from_prospect THEN 'esperando_respuesta'
      ELSE 'en_seguimiento'
    END,
    updated_at = now()
  WHERE id = p_prospect_id;
  
  RETURN message_id;
END;
$$;
