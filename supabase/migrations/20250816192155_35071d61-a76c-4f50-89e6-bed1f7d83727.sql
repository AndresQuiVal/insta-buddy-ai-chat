-- Crear tabla para los nombres de listas personalizadas de prospectos
CREATE TABLE public.prospect_list_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  list_name TEXT NOT NULL DEFAULT 'Mi Lista de prospección',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id)
);

-- Habilitar RLS
ALTER TABLE public.prospect_list_settings ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan gestionar sus propias configuraciones
CREATE POLICY "Users can manage their own prospect list settings" 
ON public.prospect_list_settings 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_prospect_list_settings_updated_at
BEFORE UPDATE ON public.prospect_list_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();