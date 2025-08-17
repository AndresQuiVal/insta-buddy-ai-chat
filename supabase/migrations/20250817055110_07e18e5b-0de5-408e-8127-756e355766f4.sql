-- Crear tabla para el estado de tareas completadas de cada prospecto
CREATE TABLE public.prospect_task_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  prospect_sender_id TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'pending', 'yesterday', 'week', 'new'
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  last_message_type TEXT NULL, -- 'sent' o 'received'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar duplicados por usuario + prospecto + tipo de tarea
  UNIQUE(instagram_user_id, prospect_sender_id, task_type)
);

-- Enable RLS
ALTER TABLE public.prospect_task_status ENABLE ROW LEVEL SECURITY;

-- Policy para que solo el usuario pueda ver/editar sus propias tareas
CREATE POLICY "Users can manage their own prospect tasks" 
ON public.prospect_task_status 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_prospect_task_status_updated_at
BEFORE UPDATE ON public.prospect_task_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para sincronizar el estado de las tareas basado en el último mensaje
CREATE OR REPLACE FUNCTION public.sync_prospect_task_status(
  p_instagram_user_id TEXT,
  p_prospect_sender_id TEXT,
  p_last_message_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Actualizar o insertar el estado de la tarea 'pending'
  INSERT INTO public.prospect_task_status (
    instagram_user_id,
    prospect_sender_id,
    task_type,
    is_completed,
    completed_at,
    last_message_type,
    updated_at
  ) VALUES (
    p_instagram_user_id,
    p_prospect_sender_id,
    'pending',
    CASE WHEN p_last_message_type = 'sent' THEN true ELSE false END,
    CASE WHEN p_last_message_type = 'sent' THEN now() ELSE null END,
    p_last_message_type,
    now()
  )
  ON CONFLICT (instagram_user_id, prospect_sender_id, task_type)
  DO UPDATE SET
    is_completed = CASE WHEN p_last_message_type = 'sent' THEN true ELSE false END,
    completed_at = CASE WHEN p_last_message_type = 'sent' THEN now() ELSE null END,
    last_message_type = p_last_message_type,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;