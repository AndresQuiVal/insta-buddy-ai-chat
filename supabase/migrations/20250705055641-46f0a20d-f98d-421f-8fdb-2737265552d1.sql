
-- Agregar columnas para configuración de botones en autoresponder_messages
ALTER TABLE public.autoresponder_messages 
ADD COLUMN use_buttons boolean DEFAULT false,
ADD COLUMN buttons jsonb DEFAULT NULL;

-- Agregar columnas para configuración de botones en general_comment_autoresponders  
ALTER TABLE public.general_comment_autoresponders
ADD COLUMN use_buttons boolean DEFAULT false,
ADD COLUMN buttons jsonb DEFAULT NULL;

-- Agregar columnas para configuración de botones en comment_autoresponders
ALTER TABLE public.comment_autoresponders
ADD COLUMN use_buttons boolean DEFAULT false,
ADD COLUMN buttons jsonb DEFAULT NULL;

-- Crear tabla para manejar postback actions de botones
CREATE TABLE public.button_postback_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payload_key TEXT UNIQUE NOT NULL,
  action_type TEXT NOT NULL, -- 'message', 'url_redirect', 'custom_webhook'
  action_data JSONB NOT NULL,
  autoresponder_id UUID,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para la tabla de acciones postback
ALTER TABLE public.button_postback_actions ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean solo sus acciones
CREATE POLICY "Users can view their own postback actions" 
  ON public.button_postback_actions 
  FOR SELECT 
  USING (user_id = current_setting('app.current_user_id', true));

-- Política para que usuarios creen sus propias acciones
CREATE POLICY "Users can create their own postback actions" 
  ON public.button_postback_actions 
  FOR INSERT 
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Política para que usuarios actualicen sus propias acciones
CREATE POLICY "Users can update their own postback actions" 
  ON public.button_postback_actions 
  FOR UPDATE 
  USING (user_id = current_setting('app.current_user_id', true));

-- Política para que usuarios eliminen sus propias acciones
CREATE POLICY "Users can delete their own postback actions" 
  ON public.button_postback_actions 
  FOR DELETE 
  USING (user_id = current_setting('app.current_user_id', true));
