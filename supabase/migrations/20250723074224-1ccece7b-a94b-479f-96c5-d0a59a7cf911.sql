-- Crear tabla para trackear confirmaciones de seguimiento pendientes
CREATE TABLE public.pending_follower_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commenter_id TEXT NOT NULL,
  commenter_username TEXT,
  autoresponder_id UUID NOT NULL,
  autoresponder_type TEXT NOT NULL CHECK (autoresponder_type IN ('specific', 'general')),
  original_comment_text TEXT,
  original_dm_message TEXT NOT NULL,
  confirmation_message_sent TEXT NOT NULL,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  original_message_sent BOOLEAN NOT NULL DEFAULT false,
  original_message_sent_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pending_follower_confirmations ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Allow all operations on pending follower confirmations" 
ON public.pending_follower_confirmations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Crear índice para búsquedas eficientes
CREATE INDEX idx_pending_follower_confirmations_commenter 
ON public.pending_follower_confirmations(commenter_id, is_confirmed);

CREATE INDEX idx_pending_follower_confirmations_expires 
ON public.pending_follower_confirmations(expires_at, is_confirmed);