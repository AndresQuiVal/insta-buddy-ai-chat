-- Habilitar las extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear cron job que ejecute la sincronización de nuevas publicaciones cada día a las 9 AM
SELECT cron.schedule(
  'sync-new-posts-daily',
  '0 9 * * *', -- Todos los días a las 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/sync-new-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb2drYnFjdXFyaWh5bmJwbnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDczNzAsImV4cCI6MjA2Mzc4MzM3MH0.9x4X9Dqc_eIkgaG4LAecrG9PIGXZEEqxYIMbLBtXjNQ"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);