-- Agregar columnas para referenciar diferentes tipos de autoresponders
ALTER TABLE public.autoresponder_followup_configs 
ADD COLUMN comment_autoresponder_id UUID NULL,
ADD COLUMN general_autoresponder_id UUID NULL;

-- Agregar foreign keys
ALTER TABLE public.autoresponder_followup_configs 
ADD CONSTRAINT fk_followup_configs_comment_autoresponder 
FOREIGN KEY (comment_autoresponder_id) 
REFERENCES public.comment_autoresponders(id) 
ON DELETE CASCADE;

ALTER TABLE public.autoresponder_followup_configs 
ADD CONSTRAINT fk_followup_configs_general_autoresponder 
FOREIGN KEY (general_autoresponder_id) 
REFERENCES public.general_comment_autoresponders(id) 
ON DELETE CASCADE;

-- Hacer que autoresponder_message_id sea nullable ya que ahora puede ser comment o general
ALTER TABLE public.autoresponder_followup_configs 
ALTER COLUMN autoresponder_message_id DROP NOT NULL;

-- Agregar constraint para asegurar que solo una referencia esté presente
ALTER TABLE public.autoresponder_followup_configs 
ADD CONSTRAINT check_single_autoresponder_reference 
CHECK (
  (autoresponder_message_id IS NOT NULL AND comment_autoresponder_id IS NULL AND general_autoresponder_id IS NULL) OR
  (autoresponder_message_id IS NULL AND comment_autoresponder_id IS NOT NULL AND general_autoresponder_id IS NULL) OR
  (autoresponder_message_id IS NULL AND comment_autoresponder_id IS NULL AND general_autoresponder_id IS NOT NULL)
);