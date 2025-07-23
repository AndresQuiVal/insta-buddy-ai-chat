-- Agregar campos para botones en comment_autoresponders
ALTER TABLE public.comment_autoresponders 
ADD COLUMN use_buttons BOOLEAN DEFAULT false,
ADD COLUMN buttons JSONB DEFAULT NULL;

-- Agregar campos para botones en general_comment_autoresponders  
ALTER TABLE public.general_comment_autoresponders
ADD COLUMN use_buttons BOOLEAN DEFAULT false,
ADD COLUMN buttons JSONB DEFAULT NULL;

-- Crear tabla para manejar postback actions de botones
CREATE TABLE public.button_postback_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  payload_key TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'comment_autoresponder' o 'general_autoresponder'
  autoresponder_id UUID,
  action_data JSONB NOT NULL, -- datos del autoresponder y configuración
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para tracking de botones presionados
CREATE TABLE public.button_clicks_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  postback_action_id UUID REFERENCES public.button_postback_actions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  payload_received TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_message_sent BOOLEAN DEFAULT false,
  original_message_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_data JSONB
);

-- Índices para mejor performance
CREATE INDEX idx_button_postback_actions_payload ON public.button_postback_actions(payload_key);
CREATE INDEX idx_button_postback_actions_user_id ON public.button_postback_actions(user_id);
CREATE INDEX idx_button_clicks_log_sender_id ON public.button_clicks_log(sender_id);
CREATE INDEX idx_button_clicks_log_clicked_at ON public.button_clicks_log(clicked_at);

-- Habilitar RLS
ALTER TABLE public.button_postback_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.button_clicks_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para button_postback_actions
CREATE POLICY "Users can view their own postback actions" 
ON public.button_postback_actions 
FOR SELECT 
USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create their own postback actions" 
ON public.button_postback_actions 
FOR INSERT 
WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own postback actions" 
ON public.button_postback_actions 
FOR UPDATE 
USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own postback actions" 
ON public.button_postback_actions 
FOR DELETE 
USING (user_id = current_setting('app.current_user_id', true));

-- Políticas RLS para button_clicks_log (acceso completo para sistema)
CREATE POLICY "Allow all operations on button clicks log" 
ON public.button_clicks_log 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Comentarios para documentar las nuevas tablas
COMMENT ON TABLE public.button_postback_actions IS 'Almacena configuraciones de botones para autoresponders';
COMMENT ON TABLE public.button_clicks_log IS 'Log de clicks en botones de autoresponders';
COMMENT ON COLUMN public.comment_autoresponders.use_buttons IS 'Si está activado, envía mensaje con botones en lugar de mensaje directo';
COMMENT ON COLUMN public.comment_autoresponders.buttons IS 'Configuración JSON de botones para el mensaje';
COMMENT ON COLUMN public.general_comment_autoresponders.use_buttons IS 'Si está activado, envía mensaje con botones en lugar de mensaje directo';
COMMENT ON COLUMN public.general_comment_autoresponders.buttons IS 'Configuración JSON de botones para el mensaje';