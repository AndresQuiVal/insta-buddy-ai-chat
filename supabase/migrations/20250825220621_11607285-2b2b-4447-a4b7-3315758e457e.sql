-- Remove the existing hourly cron job
SELECT cron.unschedule('send-whatsapp-notifications-hourly');

-- Create a new cron job that runs every minute
SELECT cron.schedule(
  'send-whatsapp-notifications-minutely',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/send-whatsapp-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb2drYnFjdXFyaWh5bmJwbnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDczNzAsImV4cCI6MjA2Mzc4MzM3MH0.9x4X9Dqc_eIkgaG4LAecrG9PIGXZEEqxYIMbLBtXjNQ"}'::jsonb,
    body := concat('{"triggered_at": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);