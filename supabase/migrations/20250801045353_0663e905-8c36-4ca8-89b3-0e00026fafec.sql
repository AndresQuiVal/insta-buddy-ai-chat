-- Agregar columnas para botones en comment_autoresponders
ALTER TABLE comment_autoresponders
ADD COLUMN use_button_message boolean DEFAULT false,
ADD COLUMN button_text text,
ADD COLUMN button_url text;

-- Agregar columnas para botones en general_comment_autoresponders
ALTER TABLE general_comment_autoresponders
ADD COLUMN use_button_message boolean DEFAULT false,
ADD COLUMN button_text text,
ADD COLUMN button_url text;