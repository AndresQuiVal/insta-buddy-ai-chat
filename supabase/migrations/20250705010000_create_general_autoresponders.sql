
-- Crear tabla para autoresponders generales (reutilizables)
CREATE TABLE public.general_comment_autoresponders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  dm_message TEXT NOT NULL,
  public_reply_messages TEXT[] DEFAULT ARRAY['¡Gracias por tu comentario! Te he enviado más información por mensaje privado 😊'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para asignaciones de autoresponders a posts
CREATE TABLE public.post_autoresponder_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  post_url TEXT NOT NULL,
  post_caption TEXT,
  general_autoresponder_id UUID NOT NULL REFERENCES public.general_comment_autoresponders(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id) -- Un post solo puede tener un autoresponder asignado
);

-- RLS para autoresponders generales
ALTER TABLE public.general_comment_autoresponders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own general autoresponders" 
  ON public.general_comment_autoresponders 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own general autoresponders" 
  ON public.general_comment_autoresponders 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own general autoresponders" 
  ON public.general_comment_autoresponders 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete their own general autoresponders" 
  ON public.general_comment_autoresponders 
  FOR DELETE 
  USING (true);

-- RLS para asignaciones
ALTER TABLE public.post_autoresponder_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments" 
  ON public.post_autoresponder_assignments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own assignments" 
  ON public.post_autoresponder_assignments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own assignments" 
  ON public.post_autoresponder_assignments 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete their own assignments" 
  ON public.post_autoresponder_assignments 
  FOR DELETE 
  USING (true);
