-- Eliminar usuario hower.a.i y todos sus datos relacionados

-- Primero eliminar todos los autorespondedores relacionados
DELETE FROM autoresponder_messages WHERE instagram_user_id_ref = '17841476552113029';
DELETE FROM general_comment_autoresponders WHERE user_id = '17841476552113029';
DELETE FROM comment_autoresponders WHERE user_id = '17841476552113029';

-- Eliminar características de clientes ideales
DELETE FROM ideal_client_traits WHERE instagram_user_id_ref = '17841476552113029';

-- Eliminar mensajes de Instagram relacionados
DELETE FROM instagram_messages WHERE instagram_user_id = '211e0394-8ed8-431f-be95-939582f0b43d';

-- Eliminar prospectos relacionados
DELETE FROM prospects WHERE instagram_user_id = '211e0394-8ed8-431f-be95-939582f0b43d';

-- Finalmente eliminar el usuario de Instagram
DELETE FROM instagram_users WHERE id = '211e0394-8ed8-431f-be95-939582f0b43d';