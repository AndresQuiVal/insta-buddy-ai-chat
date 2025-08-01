-- Agregar campos para configurar el tipo de botón y respuesta del postback
ALTER TABLE comment_autoresponders 
ADD COLUMN button_type text DEFAULT 'web_url' CHECK (button_type IN ('web_url', 'postback')),
ADD COLUMN postback_response text;

ALTER TABLE general_comment_autoresponders 
ADD COLUMN button_type text DEFAULT 'web_url' CHECK (button_type IN ('web_url', 'postback')),
ADD COLUMN postback_response text;