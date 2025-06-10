-- Create prospect_analysis table
CREATE TABLE IF NOT EXISTS prospect_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id text NOT NULL,
  met_traits text[] DEFAULT '{}',
  met_trait_indices integer[] DEFAULT '{}',
  match_points integer DEFAULT 0,
  message_count integer DEFAULT 0,
  analysis_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_analyzed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_prospect_analysis_sender_id ON prospect_analysis(sender_id);
CREATE INDEX idx_prospect_analysis_match_points ON prospect_analysis(match_points);
CREATE INDEX idx_prospect_analysis_last_analyzed_at ON prospect_analysis(last_analyzed_at);

-- Add unique constraint on sender_id
ALTER TABLE prospect_analysis ADD CONSTRAINT prospect_analysis_sender_id_key UNIQUE (sender_id); 