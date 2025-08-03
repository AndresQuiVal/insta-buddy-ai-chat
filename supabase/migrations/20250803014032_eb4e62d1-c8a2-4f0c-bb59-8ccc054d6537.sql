-- Eliminar usuarios @mamaconproposito_treiding y @addysdigitalacademy de la base de datos

-- 1. Eliminar logs de autoresponders de comentarios
DELETE FROM comment_autoresponder_log 
WHERE commenter_instagram_id IN (
  SELECT prospect_instagram_id 
  FROM prospects p
  JOIN instagram_users iu ON p.instagram_user_id = iu.id
  WHERE iu.username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 2. Eliminar follow-ups de autoresponders
DELETE FROM autoresponder_followups 
WHERE sender_id IN (
  SELECT prospect_instagram_id 
  FROM prospects p
  JOIN instagram_users iu ON p.instagram_user_id = iu.id
  WHERE iu.username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 3. Eliminar acciones de postback de botones
DELETE FROM button_postback_actions 
WHERE user_id IN ('17841470134624243', '17841466596431037');

-- 4. Eliminar mensajes de Instagram
DELETE FROM instagram_messages 
WHERE instagram_user_id IN (
  SELECT id FROM instagram_users 
  WHERE username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 5. Eliminar mensajes de prospectos
DELETE FROM prospect_messages 
WHERE prospect_id IN (
  SELECT p.id 
  FROM prospects p
  JOIN instagram_users iu ON p.instagram_user_id = iu.id
  WHERE iu.username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 6. Eliminar prospectos
DELETE FROM prospects 
WHERE instagram_user_id IN (
  SELECT id FROM instagram_users 
  WHERE username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 7. Eliminar análisis de prospectos
DELETE FROM prospect_analysis 
WHERE sender_id IN (
  SELECT prospect_instagram_id 
  FROM prospects p
  JOIN instagram_users iu ON p.instagram_user_id = iu.id
  WHERE iu.username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 8. Eliminar actividad de prospectos
DELETE FROM prospect_last_activity 
WHERE prospect_id IN (
  SELECT prospect_instagram_id 
  FROM prospects p
  JOIN instagram_users iu ON p.instagram_user_id = iu.id
  WHERE iu.username IN ('mamaconproposito_treiding', 'addysdigitalacademy')
);

-- 9. Eliminar configuraciones de follow-up
DELETE FROM autoresponder_followup_configs 
WHERE autoresponder_message_id IN (
  SELECT id FROM autoresponder_messages 
  WHERE instagram_user_id_ref IN ('17841470134624243', '17841466596431037')
);

-- 10. Eliminar logs de autoresponders enviados
DELETE FROM autoresponder_sent_log 
WHERE autoresponder_message_id IN (
  SELECT id FROM autoresponder_messages 
  WHERE instagram_user_id_ref IN ('17841470134624243', '17841466596431037')
);

-- 11. Eliminar autoresponders de comentarios específicos
DELETE FROM comment_autoresponders 
WHERE user_id IN ('17841470134624243', '17841466596431037');

-- 12. Eliminar autoresponders generales de comentarios
DELETE FROM general_comment_autoresponders 
WHERE user_id IN ('17841470134624243', '17841466596431037');

-- 13. Eliminar asignaciones de autoresponders a posts
DELETE FROM post_autoresponder_assignments 
WHERE user_id IN ('17841470134624243', '17841466596431037');

-- 14. Eliminar confirmaciones pendientes de seguidores
DELETE FROM pending_follower_confirmations 
WHERE autoresponder_id IN (
  SELECT id FROM autoresponder_messages 
  WHERE instagram_user_id_ref IN ('17841470134624243', '17841466596431037')
) OR autoresponder_id IN (
  SELECT id FROM comment_autoresponders 
  WHERE user_id IN ('17841470134624243', '17841466596431037')
) OR autoresponder_id IN (
  SELECT id FROM general_comment_autoresponders 
  WHERE user_id IN ('17841470134624243', '17841466596431037')
);

-- 15. Eliminar mensajes de autoresponders
DELETE FROM autoresponder_messages 
WHERE instagram_user_id_ref IN ('17841470134624243', '17841466596431037');

-- 16. Eliminar características de cliente ideal
DELETE FROM ideal_client_traits 
WHERE instagram_user_id_ref IN ('17841470134624243', '17841466596431037');

-- 17. Finalmente, eliminar los usuarios de Instagram
DELETE FROM instagram_users 
WHERE username IN ('mamaconproposito_treiding', 'addysdigitalacademy');