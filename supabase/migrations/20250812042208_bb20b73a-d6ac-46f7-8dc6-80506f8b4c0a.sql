-- Create table to store complete flow graphs
CREATE TABLE IF NOT EXISTS public.conversation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- instagram_users.instagram_user_id
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- e.g. 'comment' | 'dm'
  source_ref TEXT NOT NULL,  -- post_id for comments or autoresponder id as text for DMs
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index to upsert by (user_id, source_type, source_ref)
CREATE UNIQUE INDEX IF NOT EXISTS conversation_flows_user_source_unique
  ON public.conversation_flows (user_id, source_type, source_ref);

-- Enable RLS
ALTER TABLE public.conversation_flows ENABLE ROW LEVEL SECURITY;

-- Policies similar to existing tables tied to instagram_users
DROP POLICY IF EXISTS "Users can insert their own flows" ON public.conversation_flows;
CREATE POLICY "Users can insert their own flows"
ON public.conversation_flows
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT instagram_users.instagram_user_id
    FROM public.instagram_users
    WHERE instagram_users.is_active = true
  )
);

DROP POLICY IF EXISTS "Users can view their own flows" ON public.conversation_flows;
CREATE POLICY "Users can view their own flows"
ON public.conversation_flows
FOR SELECT
USING (
  user_id IN (
    SELECT instagram_users.instagram_user_id
    FROM public.instagram_users
    WHERE instagram_users.is_active = true
  )
);

DROP POLICY IF EXISTS "Users can update their own flows" ON public.conversation_flows;
CREATE POLICY "Users can update their own flows"
ON public.conversation_flows
FOR UPDATE
USING (
  user_id IN (
    SELECT instagram_users.instagram_user_id
    FROM public.instagram_users
    WHERE instagram_users.is_active = true
  )
);

DROP POLICY IF EXISTS "Users can delete their own flows" ON public.conversation_flows;
CREATE POLICY "Users can delete their own flows"
ON public.conversation_flows
FOR DELETE
USING (
  user_id IN (
    SELECT instagram_users.instagram_user_id
    FROM public.instagram_users
    WHERE instagram_users.is_active = true
  )
);

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_conversation_flows_updated_at ON public.conversation_flows;
CREATE TRIGGER update_conversation_flows_updated_at
BEFORE UPDATE ON public.conversation_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();