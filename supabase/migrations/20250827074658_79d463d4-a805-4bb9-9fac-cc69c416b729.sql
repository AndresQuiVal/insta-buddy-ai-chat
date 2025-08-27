-- Verificar y arreglar las políticas RLS para prospect_search_results
DROP POLICY IF EXISTS "Users can manage their own search results" ON public.prospect_search_results;

-- Recrear políticas más específicas
CREATE POLICY "Users can view their own search results" 
ON public.prospect_search_results 
FOR SELECT 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

CREATE POLICY "System can insert search results" 
ON public.prospect_search_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update search results" 
ON public.prospect_search_results 
FOR UPDATE 
USING (true);

CREATE POLICY "System can delete search results" 
ON public.prospect_search_results 
FOR DELETE 
USING (true);

-- Insertar datos de prueba para @pruebahower
INSERT INTO prospect_search_results (
  instagram_user_id,
  result_type,
  instagram_url,
  title,
  description,
  comments_count,
  publish_date,
  is_recent,
  has_keywords,
  search_keywords
) VALUES 
(
  '17841476656827421',
  'post',
  'https://www.instagram.com/p/test123/',
  'Post de Instagram',
  'Post sobre emprendimiento y desarrollo personal que puede tener muy buenos prospectos...',
  45,
  'Agosto 25, 2025',
  true,
  true,
  ARRAY['emprendedores jóvenes', 'desarrollo personal', 'ingresos extra']
),
(
  '17841476656827421',
  'post',
  'https://www.instagram.com/p/test456/',
  'Reel de Instagram',
  'Reel motivacional sobre negocios online y libertad financiera...',
  32,
  'Agosto 24, 2025',
  true,
  false,
  ARRAY['negocios online', 'viajar y trabajar']
),
(
  '17841476656827421',
  'account',
  'https://www.instagram.com/emprendedor_exitoso/',
  '@emprendedor_exitoso',
  'Coach de negocios especializado en emprendimiento digital y desarrollo personal...',
  0,
  '',
  false,
  true,
  ARRAY['emprendedores jóvenes', 'desarrollo personal']
),
(
  '17841476656827421',
  'account',
  'https://www.instagram.com/viajeros_digitales/',
  '@viajeros_digitales',
  'Comunidad de nómadas digitales que enseñan sobre trabajo remoto y libertad...',
  0,
  '',
  false,
  true,
  ARRAY['viajar y trabajar', 'negocios online']
);