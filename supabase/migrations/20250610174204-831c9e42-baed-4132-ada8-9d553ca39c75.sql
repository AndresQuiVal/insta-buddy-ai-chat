
-- Crear tabla para respuestas automáticas
CREATE TABLE public.autoresponder_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  message_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  name text NOT NULL, -- Nombre descriptivo para la respuesta
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.autoresponder_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que cada usuario vea solo sus respuestas
CREATE POLICY "Users can view their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own autoresponder messages" 
  ON public.autoresponder_messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear tabla para rastrear a quién ya se le envió respuesta automática
CREATE TABLE public.autoresponder_sent_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id text NOT NULL, -- ID del usuario de Instagram
  autoresponder_message_id uuid REFERENCES public.autoresponder_messages(id),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sender_id) -- Solo una respuesta automática por persona
);

-- Habilitar RLS
ALTER TABLE public.autoresponder_sent_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para el log
CREATE POLICY "Users can view their own autoresponder log" 
  ON public.autoresponder_sent_log 
  FOR SELECT 
  USING (autoresponder_message_id IN (
    SELECT id FROM autoresponder_messages WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert autoresponder log" 
  ON public.autoresponder_sent_log 
  FOR INSERT 
  WITH CHECK (true); -- El sistema puede insertar desde el webhook
