-- Corregir el instagram_user_id para fanatics.kabala1 
-- El ID correcto debe ser 739714722170459 (el recipient_id en los logs)
UPDATE public.instagram_users 
SET instagram_user_id = '739714722170459'
WHERE instagram_user_id = '17841475990037083' 
  AND username = 'fanatics.kabala1';