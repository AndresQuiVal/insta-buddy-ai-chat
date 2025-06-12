
-- Crear una nueva tabla temporal sin RLS
CREATE TABLE public.comment_autoresponders_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- Copiar datos existentes si los hay
INSERT INTO public.comment_autoresponders_new 
(id, user_id, post_id, post_url, post_caption, name, keywords, dm_message, is_active, created_at, updated_at)
SELECT id, user_id::TEXT, post_id, post_url, post_caption, name, keywords, dm_message, is_active, created_at, updated_at
FROM public.comment_autoresponders;

-- Eliminar la tabla original
DROP TABLE public.comment_autoresponders CASCADE;

-- Renombrar la nueva tabla
ALTER TABLE public.comment_autoresponders_new RENAME TO comment_autoresponders;

-- Recrear índices
CREATE INDEX idx_comment_autoresponders_user_id ON public.comment_autoresponders(user_id);
CREATE INDEX idx_comment_autoresponders_post_id ON public.comment_autoresponders(post_id);
CREATE INDEX idx_comment_autoresponders_active ON public.comment_autoresponders(is_active);

-- Recrear la tabla de log
CREATE TABLE public.comment_autoresponder_log_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_autoresponder_id UUID REFERENCES public.comment_autoresponders(id) ON DELETE CASCADE,
  commenter_instagram_id TEXT NOT NULL,
  comment_text TEXT,
  dm_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dm_message_sent TEXT NOT NULL,
  webhook_data JSONB
);

-- Copiar datos del log si los hay
INSERT INTO public.comment_autoresponder_log_new 
SELECT * FROM public.comment_autoresponder_log;

-- Eliminar tabla de log original
DROP TABLE public.comment_autoresponder_log CASCADE;

-- Renombrar nueva tabla de log
ALTER TABLE public.comment_autoresponder_log_new RENAME TO comment_autoresponder_log;

-- Recrear índices del log
CREATE INDEX idx_comment_log_autoresponder_id ON public.comment_autoresponder_log(comment_autoresponder_id);
CREATE INDEX idx_comment_log_commenter_id ON public.comment_autoresponder_log(commenter_instagram_id);
CREATE INDEX idx_comment_log_sent_at ON public.comment_autoresponder_log(dm_sent_at);
