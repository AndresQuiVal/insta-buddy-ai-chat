
-- Corregir el número de WhatsApp de +52+573004696218 a +573004696218
UPDATE whatsapp_notification_settings 
SET whatsapp_number = '+573004696218',
    updated_at = now()
WHERE whatsapp_number LIKE '%3004696218%';
