-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  value jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create instagram_pages table
CREATE TABLE IF NOT EXISTS instagram_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id text NOT NULL,
  page_name text NOT NULL,
  access_token text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraints
ALTER TABLE settings ADD CONSTRAINT settings_key_key UNIQUE (key);
ALTER TABLE instagram_pages ADD CONSTRAINT instagram_pages_page_id_key UNIQUE (page_id);

-- Create indexes
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_instagram_pages_page_id ON instagram_pages(page_id); 