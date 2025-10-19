-- Crear tabla para registrar envíos de notificaciones WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_user_id TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  notification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_sent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para evitar duplicados en el mismo día
  UNIQUE(instagram_user_id, notification_date)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_whatsapp_log_user_date ON public.whatsapp_notification_log(instagram_user_id, notification_date);
CREATE INDEX idx_whatsapp_log_date ON public.whatsapp_notification_log(notification_date);

-- RLS políticas
ALTER TABLE public.whatsapp_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification log"
  ON public.whatsapp_notification_log
  FOR SELECT
  USING (
    instagram_user_id IN (
      SELECT instagram_user_id 
      FROM instagram_users 
      WHERE is_active = true
    )
  );

CREATE POLICY "System can insert notification log"
  ON public.whatsapp_notification_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update notification log"
  ON public.whatsapp_notification_log
  FOR UPDATE
  USING (true);