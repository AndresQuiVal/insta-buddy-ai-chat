
-- Crear tabla para usuarios autenticados por Instagram
CREATE TABLE public.instagram_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  nuevos_prospectos_contactados INTEGER NOT NULL DEFAULT 0,
  openai_api_key TEXT,
  ia_persona TEXT DEFAULT 'Eres un asistente profesional y amigable que ayuda con ventas y prospección.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla
ALTER TABLE public.instagram_users ENABLE ROW LEVEL SECURITY;

-- Política para que cada usuario solo vea sus propios datos
CREATE POLICY "Users can view their own data" 
  ON public.instagram_users 
  FOR ALL
  USING (instagram_user_id = current_setting('app.current_instagram_user_id', true));

-- Actualizar tabla de autoresponders para referenciar instagram_users
ALTER TABLE public.autoresponder_messages 
ADD COLUMN instagram_user_id UUID REFERENCES public.instagram_users(id) ON DELETE CASCADE;

-- Actualizar tabla de mensajes para referenciar instagram_users
ALTER TABLE public.instagram_messages 
ADD COLUMN instagram_user_id UUID REFERENCES public.instagram_users(id) ON DELETE CASCADE;

-- Actualizar tabla de traits para referenciar instagram_users
ALTER TABLE public.ideal_client_traits 
ADD COLUMN instagram_user_id UUID REFERENCES public.instagram_users(id) ON DELETE CASCADE;

-- Función para obtener token activo por Instagram User ID
CREATE OR REPLACE FUNCTION public.get_instagram_token_by_user_id(user_instagram_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  SELECT access_token INTO token
  FROM public.instagram_users
  WHERE instagram_user_id = user_instagram_id
    AND is_active = true
    AND (token_expires_at IS NULL OR token_expires_at > now());
  
  RETURN token;
END;
$$;

-- Función para incrementar nuevos prospectos por Instagram User ID
CREATE OR REPLACE FUNCTION public.increment_nuevos_prospectos_by_instagram_id(user_instagram_id TEXT, increment_by INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.instagram_users 
  SET 
    nuevos_prospectos_contactados = nuevos_prospectos_contactados + increment_by,
    updated_at = now()
  WHERE instagram_user_id = user_instagram_id;
END;
$$;

-- Función para resetear nuevos prospectos por Instagram User ID
CREATE OR REPLACE FUNCTION public.reset_nuevos_prospectos_by_instagram_id(user_instagram_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.instagram_users 
  SET 
    nuevos_prospectos_contactados = 0,
    updated_at = now()
  WHERE instagram_user_id = user_instagram_id;
END;
$$;
