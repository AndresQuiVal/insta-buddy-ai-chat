-- Agregar columnas de biografía y estadísticas a la tabla prospects
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS follows_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_count INTEGER DEFAULT 0;