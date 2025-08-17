-- Crear tabla para respuestas diarias únicas por prospecto
CREATE TABLE public.daily_prospect_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  prospect_sender_id TEXT NOT NULL,
  response_date DATE NOT NULL DEFAULT CURRENT_DATE,
  first_response_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id, prospect_sender_id, response_date)
);

-- Habilitar RLS
ALTER TABLE public.daily_prospect_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own daily responses" 
ON public.daily_prospect_responses 
FOR SELECT 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

CREATE POLICY "System can insert daily responses" 
ON public.daily_prospect_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update daily responses" 
ON public.daily_prospect_responses 
FOR UPDATE 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_daily_responses_updated_at
BEFORE UPDATE ON public.daily_prospect_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para registrar respuesta diaria única
CREATE OR REPLACE FUNCTION public.register_daily_prospect_response(
  p_instagram_user_id TEXT,
  p_prospect_sender_id TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.daily_prospect_responses (
    instagram_user_id,
    prospect_sender_id,
    response_date,
    first_response_at,
    message_count
  )
  VALUES (
    p_instagram_user_id,
    p_prospect_sender_id,
    CURRENT_DATE,
    now(),
    1
  )
  ON CONFLICT (instagram_user_id, prospect_sender_id, response_date)
  DO UPDATE SET
    message_count = daily_prospect_responses.message_count + 1,
    updated_at = now();
    
  -- Actualizar métrica diaria
  PERFORM public.update_daily_metric(p_instagram_user_id, 'responses_obtained', 1);
END;
$function$;