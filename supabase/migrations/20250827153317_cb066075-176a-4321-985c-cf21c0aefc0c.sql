-- Agregar campos de credenciales de Hower a la tabla instagram_users
ALTER TABLE public.instagram_users 
ADD COLUMN hower_username text,
ADD COLUMN hower_token text;

-- Crear índice para mejorar performance
CREATE INDEX idx_instagram_users_hower_credentials 
ON public.instagram_users (hower_username) 
WHERE hower_username IS NOT NULL;