-- Actualizar configuración de WhatsApp para +593991293948
-- Configurar timezone a Ecuador y actualizar horario de miércoles a 1pm

-- Primero actualizar el timezone a Ecuador
UPDATE whatsapp_notification_settings 
SET timezone = 'America/Guayaquil',
    updated_at = now()
WHERE whatsapp_number = '+593991293948';

-- Luego actualizar el horario del miércoles (día 3) a 13:00
-- Primero obtener el instagram_user_id
WITH user_data AS (
  SELECT instagram_user_id 
  FROM whatsapp_notification_settings 
  WHERE whatsapp_number = '+593991293948'
)
INSERT INTO whatsapp_schedule_days (instagram_user_id, day_of_week, notification_time, enabled)
SELECT 
  ud.instagram_user_id,
  3, -- Miércoles
  '13:00:00'::time,
  true
FROM user_data ud
ON CONFLICT (instagram_user_id, day_of_week)
DO UPDATE SET
  notification_time = '13:00:00'::time,
  enabled = true,
  updated_at = now();