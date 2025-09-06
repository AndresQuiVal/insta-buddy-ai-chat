-- Arreglar permisos RLS para daily_prospect_metrics
-- Permitir que las funciones del sistema (incluidas las RPCs) puedan insertar/actualizar

-- Política para permitir inserción desde funciones del sistema
DROP POLICY IF EXISTS "System can insert daily metrics" ON daily_prospect_metrics;
CREATE POLICY "System can insert daily metrics" 
ON daily_prospect_metrics 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir actualización desde funciones del sistema  
DROP POLICY IF EXISTS "System can update daily metrics" ON daily_prospect_metrics;
CREATE POLICY "System can update daily metrics" 
ON daily_prospect_metrics 
FOR UPDATE 
USING (true);

-- También asegurar que los usuarios puedan ver sus propias métricas
-- (esta política ya existe pero la recreamos para estar seguros)
DROP POLICY IF EXISTS "Users can view their own metrics" ON daily_prospect_metrics;
CREATE POLICY "Users can view their own metrics" 
ON daily_prospect_metrics 
FOR SELECT 
USING (instagram_user_id IN (
  SELECT instagram_users.instagram_user_id
  FROM instagram_users
  WHERE instagram_users.is_active = true
));