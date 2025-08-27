-- Crear tabla para almacenar resultados de búsqueda de prospectos
CREATE TABLE IF NOT EXISTS public.prospect_search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  result_type TEXT NOT NULL, -- 'post' o 'account'
  instagram_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  comments_count INTEGER DEFAULT 0,
  is_recent BOOLEAN DEFAULT false,
  has_keywords BOOLEAN DEFAULT false,
  publish_date TEXT,
  search_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospect_search_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own search results" 
ON public.prospect_search_results 
FOR SELECT 
USING (instagram_user_id IN (
  SELECT instagram_users.instagram_user_id 
  FROM instagram_users 
  WHERE instagram_users.is_active = true
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