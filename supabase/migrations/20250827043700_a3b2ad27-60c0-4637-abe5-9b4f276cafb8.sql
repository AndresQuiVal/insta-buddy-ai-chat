-- Crear tabla para guardar el ICP (Ideal Customer Profile) de cada usuario
CREATE TABLE public.user_icp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  who_answer TEXT,
  where_answer TEXT,
  bait_answer TEXT,
  result_answer TEXT,
  search_keywords TEXT[] DEFAULT '{}',
  bullseye_score INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instagram_user_id)
);

-- Enable RLS
ALTER TABLE public.user_icp ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ICP" 
ON public.user_icp 
FOR SELECT 
USING (instagram_user_id IN (
  SELECT instagram_users.instagram_user_id
  FROM instagram_users
  WHERE instagram_users.is_active = true
));

CREATE POLICY "Users can create their own ICP" 
ON public.user_icp 
FOR INSERT 
WITH CHECK (instagram_user_id IN (
  SELECT instagram_users.instagram_user_id
  FROM instagram_users
  WHERE instagram_users.is_active = true
));

CREATE POLICY "Users can update their own ICP" 
ON public.user_icp 
FOR UPDATE 
USING (instagram_user_id IN (
  SELECT instagram_users.instagram_user_id
  FROM instagram_users
  WHERE instagram_users.is_active = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_icp_updated_at
BEFORE UPDATE ON public.user_icp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();