-- Crear tabla para follow-ups configurados
CREATE TABLE public.autoresponder_followup_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  autoresponder_message_id UUID NOT NULL,
  sequence_order INTEGER NOT NULL, -- 1, 2, 3, 4
  delay_hours INTEGER NOT NULL CHECK (delay_hours >= 1 AND delay_hours <= 23),
  message_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar foreign key al autoresponder
ALTER TABLE public.autoresponder_followup_configs 
ADD CONSTRAINT fk_autoresponder_followup_configs_message_id 
FOREIGN KEY (autoresponder_message_id) 
REFERENCES public.autoresponder_messages(id) 
ON DELETE CASCADE;

-- Crear índice único para evitar duplicados de secuencia por autoresponder
CREATE UNIQUE INDEX idx_autoresponder_followup_configs_unique 
ON public.autoresponder_followup_configs(autoresponder_message_id, sequence_order);

-- Habilitar RLS
ALTER TABLE public.autoresponder_followup_configs ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their own followup configs" 
ON public.autoresponder_followup_configs 
FOR SELECT 
USING (
  autoresponder_message_id IN (
    SELECT id FROM public.autoresponder_messages 
    WHERE instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  )
);

CREATE POLICY "Users can create their own followup configs" 
ON public.autoresponder_followup_configs 
FOR INSERT 
WITH CHECK (
  autoresponder_message_id IN (
    SELECT id FROM public.autoresponder_messages 
    WHERE instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  )
);

CREATE POLICY "Users can update their own followup configs" 
ON public.autoresponder_followup_configs 
FOR UPDATE 
USING (
  autoresponder_message_id IN (
    SELECT id FROM public.autoresponder_messages 
    WHERE instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  )
);

CREATE POLICY "Users can delete their own followup configs" 
ON public.autoresponder_followup_configs 
FOR DELETE 
USING (
  autoresponder_message_id IN (
    SELECT id FROM public.autoresponder_messages 
    WHERE instagram_user_id_ref IN (
      SELECT instagram_user_id FROM public.instagram_users WHERE is_active = true
    )
  )
);