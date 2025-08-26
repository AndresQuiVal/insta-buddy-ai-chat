-- ARREGLAR PROBLEMA DE SEGURIDAD: Habilitar RLS en tabla ideal_client_traits
ALTER TABLE public.ideal_client_traits ENABLE ROW LEVEL SECURITY;

-- Crear política RLS para ideal_client_traits
CREATE POLICY "Users can manage their own traits" ON public.ideal_client_traits
FOR ALL USING (
  instagram_user_id_ref IN (
    SELECT instagram_user_id 
    FROM public.instagram_users 
    WHERE is_active = true
  )
);