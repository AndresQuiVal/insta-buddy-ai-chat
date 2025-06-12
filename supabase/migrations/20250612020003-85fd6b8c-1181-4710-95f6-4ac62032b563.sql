
-- Crear tabla para autoresponders de comentarios de posts
CREATE TABLE public.comment_autoresponders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  post_id TEXT NOT NULL,
  post_url TEXT NOT NULL,
  post_caption TEXT,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  dm_message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar índices para mejor rendimiento
CREATE INDEX idx_comment_autoresponders_user_id ON public.comment_autoresponders(user_id);
CREATE INDEX idx_comment_autoresponders_post_id ON public.comment_autoresponders(post_id);
CREATE INDEX idx_comment_autoresponders_active ON public.comment_autoresponders(is_active);

-- Habilitar Row Level Security
ALTER TABLE public.comment_autoresponders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que los usuarios solo vean sus propios autoresponders
CREATE POLICY "Users can view their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment autoresponders" 
  ON public.comment_autoresponders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear tabla para log de DMs enviados por comentarios
CREATE TABLE public.comment_autoresponder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_autoresponder_id UUID REFERENCES public.comment_autoresponders(id) ON DELETE CASCADE,
  commenter_instagram_id TEXT NOT NULL,
  comment_text TEXT,
  dm_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dm_message_sent TEXT NOT NULL,
  webhook_data JSONB
);

-- Índices para el log
CREATE INDEX idx_comment_log_autoresponder_id ON public.comment_autoresponder_log(comment_autoresponder_id);
CREATE INDEX idx_comment_log_commenter_id ON public.comment_autoresponder_log(commenter_instagram_id);
CREATE INDEX idx_comment_log_sent_at ON public.comment_autoresponder_log(dm_sent_at);

-- Comentarios para documentar las tablas
COMMENT ON TABLE public.comment_autoresponders IS 'Configuración de autoresponders para comentarios de posts de Instagram';
COMMENT ON TABLE public.comment_autoresponder_log IS 'Log de DMs enviados automáticamente por comentarios detectados';
