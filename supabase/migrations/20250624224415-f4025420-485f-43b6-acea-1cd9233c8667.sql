
-- Eliminar autoresponders que no tienen instagram_user_id_ref (son huérfanos)
DELETE FROM autoresponder_sent_log 
WHERE autoresponder_message_id IN (
  SELECT id FROM autoresponder_messages 
  WHERE instagram_user_id_ref IS NULL OR instagram_user_id_ref = ''
);

-- Eliminar los autoresponders huérfanos
DELETE FROM autoresponder_messages 
WHERE instagram_user_id_ref IS NULL OR instagram_user_id_ref = '';

-- Opcional: También eliminar autoresponders que no coinciden con ningún usuario activo
DELETE FROM autoresponder_sent_log 
WHERE autoresponder_message_id IN (
  SELECT am.id FROM autoresponder_messages am
  LEFT JOIN instagram_users iu ON am.instagram_user_id_ref = iu.instagram_user_id
  WHERE iu.instagram_user_id IS NULL
);

DELETE FROM autoresponder_messages 
WHERE id NOT IN (
  SELECT am.id FROM autoresponder_messages am
  INNER JOIN instagram_users iu ON am.instagram_user_id_ref = iu.instagram_user_id
);
