-- ELIMINAR USUARIOS: mamaconproposito_treiding y addysdigitalacademy
-- Se eliminan en orden correcto para evitar violaciones de claves foráneas

-- 1. Eliminar logs de autoresponders enviados
DELETE FROM autoresponder_sent_log 
WHERE autoresponder_message_id IN (
  SELECT am.id 
  FROM autoresponder_messages am 
  WHERE am.instagram_user_id_ref IN ('17841407955734121', '17841466422750485')
);

-- 2. Eliminar logs de confirmaciones de seguidor pendientes
DELETE FROM pending_follower_confirmations 
WHERE autoresponder_id IN (
  SELECT am.id 
  FROM autoresponder_messages am 
  WHERE am.instagram_user_id_ref IN ('17841407955734121', '17841466422750485')
);

-- 3. Eliminar follow-ups de autoresponders
DELETE FROM autoresponder_followups 
WHERE autoresponder_message_id IN (
  SELECT am.id 
  FROM autoresponder_messages am 
  WHERE am.instagram_user_id_ref IN ('17841407955734121', '17841466422750485')
);

-- 4. Eliminar configuraciones de follow-ups
DELETE FROM autoresponder_followup_configs 
WHERE autoresponder_message_id IN (
  SELECT am.id 
  FROM autoresponder_messages am 
  WHERE am.instagram_user_id_ref IN ('17841407955734121', '17841466422750485')
);

-- 5. Eliminar acciones postback de botones
DELETE FROM button_postback_actions 
WHERE user_id IN ('17841407955734121', '17841466422750485');

-- 6. Eliminar autoresponders de DM
DELETE FROM autoresponder_messages 
WHERE instagram_user_id_ref IN ('17841407955734121', '17841466422750485');

-- 7. Eliminar logs de autoresponders de comentarios
DELETE FROM comment_autoresponder_log 
WHERE webhook_data->>'instagram_user_id' IN ('17841407955734121', '17841466422750485');

-- 8. Eliminar autoresponders de comentarios específicos
DELETE FROM comment_autoresponders 
WHERE user_id IN ('17841407955734121', '17841466422750485');

-- 9. Eliminar autoresponders generales de comentarios
DELETE FROM general_comment_autoresponders 
WHERE user_id IN ('17841407955734121', '17841466422750485');

-- 10. Eliminar asignaciones de posts a autoresponders generales
DELETE FROM post_autoresponder_assignments 
WHERE user_id IN ('17841407955734121', '17841466422750485');

-- 11. Eliminar mensajes de Instagram
DELETE FROM instagram_messages 
WHERE instagram_user_id IN (
  SELECT iu.id 
  FROM instagram_users iu 
  WHERE iu.instagram_user_id IN ('17841407955734121', '17841466422750485')
);

-- 12. Eliminar análisis de prospectos
DELETE FROM prospect_analysis 
WHERE sender_id IN (
  SELECT pm.sender_id 
  FROM prospect_messages pm 
  JOIN prospects p ON pm.prospect_id = p.id 
  WHERE p.instagram_user_id IN (
    SELECT iu.id 
    FROM instagram_users iu 
    WHERE iu.instagram_user_id IN ('17841407955734121', '17841466422750485')
  )
);

-- 13. Eliminar actividad de prospectos
DELETE FROM prospect_last_activity 
WHERE prospect_id IN (
  SELECT p.prospect_instagram_id 
  FROM prospects p 
  WHERE p.instagram_user_id IN (
    SELECT iu.id 
    FROM instagram_users iu 
    WHERE iu.instagram_user_id IN ('17841407955734121', '17841466422750485')
  )
);

-- 14. Eliminar mensajes de prospectos
DELETE FROM prospect_messages 
WHERE prospect_id IN (
  SELECT p.id 
  FROM prospects p 
  WHERE p.instagram_user_id IN (
    SELECT iu.id 
    FROM instagram_users iu 
    WHERE iu.instagram_user_id IN ('17841407955734121', '17841466422750485')
  )
);

-- 15. Eliminar prospectos
DELETE FROM prospects 
WHERE instagram_user_id IN (
  SELECT iu.id 
  FROM instagram_users iu 
  WHERE iu.instagram_user_id IN ('17841407955734121', '17841466422750485')
);

-- 16. Eliminar características de cliente ideal
DELETE FROM ideal_client_traits 
WHERE instagram_user_id_ref IN ('17841407955734121', '17841466422750485');

-- 17. Eliminar configuraciones de usuario
DELETE FROM user_settings 
WHERE instagram_page_id IN ('17841407955734121', '17841466422750485');

-- 18. FINALMENTE, eliminar los usuarios de Instagram
DELETE FROM instagram_users 
WHERE instagram_user_id IN ('17841407955734121', '17841466422750485');