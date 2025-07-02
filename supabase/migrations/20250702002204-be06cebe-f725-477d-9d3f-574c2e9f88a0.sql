
-- Crear tabla para seguimiento de follow-ups
CREATE TABLE public.autoresponder_followups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id text NOT NULL,
  autoresponder_message_id uuid REFERENCES public.autoresponder_messages(id),
  initial_message_sent_at timestamp with time zone NOT NULL,
  followup_scheduled_at timestamp with time zone NOT NULL,
  followup_sent_at timestamp with time zone NULL,
  followup_message_text text NOT NULL DEFAULT 'Hey! pudiste checar mi mensaje anterior?',
  is_completed boolean NOT NULL DEFAULT false,
  prospect_responded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.autoresponder_followups ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow all operations on followups" 
  ON public.autoresponder_followups 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Función para procesar follow-ups pendientes
CREATE OR REPLACE FUNCTION public.process_pending_followups()
RETURNS TABLE(
  processed_count integer,
  details jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  followup_record RECORD;
  processed_count integer := 0;
  details_array jsonb[] := '{}';
  send_result jsonb;
BEGIN
  -- Buscar follow-ups que necesitan ser enviados
  FOR followup_record IN
    SELECT *
    FROM public.autoresponder_followups
    WHERE followup_scheduled_at <= now()
      AND followup_sent_at IS NULL
      AND is_completed = false
      AND prospect_responded = false
  LOOP
    -- Verificar si el prospecto ha respondido desde el mensaje inicial
    IF EXISTS (
      SELECT 1 
      FROM public.instagram_messages 
      WHERE sender_id = followup_record.sender_id 
        AND message_type = 'received'
        AND timestamp > followup_record.initial_message_sent_at
    ) THEN
      -- El prospecto respondió, marcar como completado sin enviar follow-up
      UPDATE public.autoresponder_followups
      SET 
        prospect_responded = true,
        is_completed = true,
        updated_at = now()
      WHERE id = followup_record.id;
      
      details_array := details_array || jsonb_build_object(
        'followup_id', followup_record.id,
        'sender_id', followup_record.sender_id,
        'status', 'skipped_prospect_responded'
      );
    ELSE
      -- El prospecto no respondió, marcar para envío
      UPDATE public.autoresponder_followups
      SET 
        followup_sent_at = now(),
        updated_at = now()
      WHERE id = followup_record.id;
      
      processed_count := processed_count + 1;
      
      details_array := details_array || jsonb_build_object(
        'followup_id', followup_record.id,
        'sender_id', followup_record.sender_id,
        'message_text', followup_record.followup_message_text,
        'status', 'ready_to_send'
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT processed_count, array_to_json(details_array)::jsonb;
END;
$$;

-- Índices para optimizar consultas
CREATE INDEX idx_autoresponder_followups_scheduled 
ON public.autoresponder_followups(followup_scheduled_at) 
WHERE followup_sent_at IS NULL AND is_completed = false;

CREATE INDEX idx_autoresponder_followups_sender 
ON public.autoresponder_followups(sender_id);
