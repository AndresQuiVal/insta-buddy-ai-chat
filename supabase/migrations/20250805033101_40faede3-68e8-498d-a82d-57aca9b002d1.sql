-- Eliminar el cron job actual que tiene problemas
SELECT cron.unschedule('process-autoresponder-followups');

-- Crear un nuevo cron job que use directamente el service role key
SELECT cron.schedule(
  'process-autoresponder-followups-fixed',
  '*/15 * * * *', -- cada 15 minutos
  $$
  SELECT
    net.http_post(
        url:='https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/process-followups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb2drYnFjdXFyaWh5bmJwbnNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIwNzM3MCwiZXhwIjoyMDYzNzgzMzcwfQ.b1rjRQoAIX8j-e3xJ6Z5lQ1FpzYN8s_nP7LPV2fNtKs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);