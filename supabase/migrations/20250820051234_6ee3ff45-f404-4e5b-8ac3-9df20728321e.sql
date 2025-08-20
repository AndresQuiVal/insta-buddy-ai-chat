-- Eliminar la función sync_prospect_task_status con 3 parámetros que está causando conflicto
DROP FUNCTION IF EXISTS public.sync_prospect_task_status(p_instagram_user_id text, p_prospect_sender_id text, p_last_message_type text);

-- La función con 4 parámetros se mantiene intacta