-- Habilitar extensiones necesarias para cron jobs
SELECT cron.schedule(
  'process-autoresponder-followups',
  '*/15 * * * *', -- Cada 15 minutos
  $$
  select
    net.http_post(
        url:='https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/process-followups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || (select value from secrets where name = 'SUPABASE_SERVICE_ROLE_KEY') || '"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);