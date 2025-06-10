
-- Agregar configuración de tiempo de reinicio automático
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS auto_reset_hours INTEGER DEFAULT 48;

-- Agregar comentario para claridad
COMMENT ON COLUMN user_settings.auto_reset_hours IS 'Horas después de las cuales se reinician automáticamente las características del prospecto si no hay actividad';

-- Crear tabla para trackear la última actividad de los prospectos
CREATE TABLE IF NOT EXISTS prospect_last_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  traits_reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(prospect_id)
);

-- Crear índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_prospect_last_activity_last_message 
ON prospect_last_activity(last_message_at);

-- Crear función para reiniciar características automáticamente
CREATE OR REPLACE FUNCTION reset_inactive_prospect_traits()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  reset_count INTEGER := 0;
  reset_hours INTEGER;
  cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obtener configuración de horas para reinicio
  SELECT COALESCE(auto_reset_hours, 48) INTO reset_hours
  FROM user_settings 
  LIMIT 1;
  
  -- Calcular tiempo de corte
  cutoff_time := now() - (reset_hours || ' hours')::INTERVAL;
  
  -- Reiniciar características de prospectos inactivos
  UPDATE prospect_analysis 
  SET 
    match_points = 0,
    met_traits = ARRAY[]::TEXT[],
    met_trait_indices = ARRAY[]::INTEGER[],
    traits_reset_at = now(),
    updated_at = now()
  WHERE sender_id IN (
    SELECT prospect_id 
    FROM prospect_last_activity 
    WHERE last_message_at < cutoff_time
    AND (traits_reset_at IS NULL OR traits_reset_at < cutoff_time)
  );
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  -- Actualizar registro de reset
  UPDATE prospect_last_activity 
  SET traits_reset_at = now()
  WHERE last_message_at < cutoff_time
  AND (traits_reset_at IS NULL OR traits_reset_at < cutoff_time);
  
  RETURN reset_count;
END;
$$;

-- Crear función para actualizar última actividad
CREATE OR REPLACE FUNCTION update_prospect_activity(p_prospect_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO prospect_last_activity (prospect_id, last_message_at)
  VALUES (p_prospect_id, now())
  ON CONFLICT (prospect_id) 
  DO UPDATE SET 
    last_message_at = now(),
    updated_at = now();
END;
$$;
