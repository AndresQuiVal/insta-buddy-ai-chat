-- Add whatsapp_number column to existing whatsapp_notification_settings table
ALTER TABLE public.whatsapp_notification_settings 
ADD COLUMN whatsapp_number TEXT;

-- Create whatsapp_schedule_days table for individual daily schedules
CREATE TABLE public.whatsapp_schedule_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  enabled BOOLEAN NOT NULL DEFAULT true,
  notification_time TIME NOT NULL DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate schedules for same user/day
  UNIQUE(instagram_user_id, day_of_week)
);

-- Enable RLS on whatsapp_schedule_days
ALTER TABLE public.whatsapp_schedule_days ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whatsapp_schedule_days
CREATE POLICY "Users can manage their own WhatsApp schedule days" 
ON public.whatsapp_schedule_days 
FOR ALL 
USING (instagram_user_id IN (
  SELECT instagram_user_id 
  FROM instagram_users 
  WHERE is_active = true
));

-- Create trigger for updated_at on whatsapp_schedule_days
CREATE TRIGGER update_whatsapp_schedule_days_updated_at
BEFORE UPDATE ON public.whatsapp_schedule_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();