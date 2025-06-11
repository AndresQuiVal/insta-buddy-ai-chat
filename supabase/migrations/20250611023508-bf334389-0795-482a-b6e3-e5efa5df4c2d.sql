
-- Eliminar la restricción única actual que solo considera sender_id
ALTER TABLE public.autoresponder_sent_log 
DROP CONSTRAINT IF EXISTS autoresponder_sent_log_sender_id_key;

-- Crear una nueva restricción única que permita múltiples autoresponders por usuario
-- pero solo uno de cada tipo por usuario
ALTER TABLE public.autoresponder_sent_log 
ADD CONSTRAINT autoresponder_sent_log_unique 
UNIQUE (sender_id, autoresponder_message_id);
