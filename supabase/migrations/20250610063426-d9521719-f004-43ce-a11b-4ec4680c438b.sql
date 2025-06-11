
-- Primero, ver qué registros hay
SELECT id, ia_persona, created_at FROM user_settings ORDER BY created_at;

-- Eliminar registros duplicados, conservando solo el más reciente
DELETE FROM user_settings 
WHERE id NOT IN (
  SELECT id 
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM user_settings
  ) t 
  WHERE rn = 1
);

-- Verificar que ahora solo hay un registro
SELECT COUNT(*) as total_records FROM user_settings;
