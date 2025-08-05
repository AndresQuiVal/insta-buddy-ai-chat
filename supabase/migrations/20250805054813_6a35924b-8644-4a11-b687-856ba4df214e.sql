-- Habilitar extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Marcar los 2 últimos follow-ups como NO enviados para que se reenvíen
UPDATE autoresponder_followups 
SET followup_sent_at = NULL, 
    updated_at = now()
WHERE id IN (
  '701e6ac5-f2bf-46bc-a3dc-1681f69ffa04',  -- "Bro, pudiste ver la guía?"
  '9c4ef4ec-e056-4243-ab68-f5fb48d14093'   -- "Holaa, si pudiste ver mi mensaje de arriba?"
);

-- Crear cron job para ejecutar process-followups cada 30 minutos
SELECT cron.schedule(
  'process-followups-auto',
  '*/30 * * * *', -- cada 30 minutos
  $$
  SELECT net.http_post(
    url := 'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/process-followups',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb2drYnFjdXFyaWh5bmJwbnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDczNzAsImV4cCI6MjA2Mzc4MzM3MH0.9x4X9Dqc_eIkgaG4LAecrG9PIGXZEEqxYIMbLBtXjNQ"}'::jsonb,
    body := '{"automated": true}'::jsonb
  ) as request_id;
  $$
);