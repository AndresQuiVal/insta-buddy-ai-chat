-- Agregar columna para código de país en la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN country_code text DEFAULT '+52';

-- Actualizar registros existentes para que tengan código de país por defecto
UPDATE public.profiles 
SET country_code = '+52' 
WHERE country_code IS NULL;