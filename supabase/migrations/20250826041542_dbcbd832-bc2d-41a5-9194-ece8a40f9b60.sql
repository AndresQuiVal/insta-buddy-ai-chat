-- Aplicar la actualización de prospect_task_status para que los prospectos en seguimiento 
-- NO aparezcan como completados (tachados)

-- Primero, destachamos (marcamos como no completados) todos los prospectos que están en seguimiento
-- Es decir, aquellos que fueron contactados hace más de 24 horas
UPDATE prospect_task_status 
SET 
  is_completed = false,
  completed_at = null,
  updated_at = now()
WHERE task_type = 'pending' 
  AND instagram_user_id IN (
    SELECT iu.instagram_user_id 
    FROM prospects p
    INNER JOIN instagram_users iu ON p.instagram_user_id = iu.id
    WHERE p.last_owner_message_at IS NOT NULL 
      AND p.last_owner_message_at <= (now() - interval '24 hours')
      AND prospect_task_status.prospect_sender_id = p.prospect_instagram_id
  );