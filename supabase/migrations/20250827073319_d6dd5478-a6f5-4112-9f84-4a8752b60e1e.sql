-- Crear tabla para almacenar resultados de búsqueda de prospectos
CREATE TABLE public.prospect_search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  result_type TEXT NOT NULL CHECK (result_type IN ('post', 'account')),
  instagram_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  comments_count INTEGER DEFAULT 0,
  publish_date TEXT,
  is_recent BOOLEAN DEFAULT false,
  has_keywords BOOLEAN DEFAULT false,
  search_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospect_search_results ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own search results
CREATE POLICY "Users can manage their own search results" 
ON public.prospect_search_results 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

-- Create index for better performance
CREATE INDEX idx_prospect_search_results_user_type ON public.prospect_search_results(instagram_user_id, result_type);
CREATE INDEX idx_prospect_search_results_created_at ON public.prospect_search_results(created_at DESC);