-- Resetear TODOS los follow-ups que fueron marcados como enviados pero nunca se enviaron realmente
-- (porque no hay registro en instagram_messages)
UPDATE autoresponder_followups 
SET 
  followup_sent_at = NULL,
  is_completed = false,
  updated_at = now()
WHERE followup_sent_at IS NOT NULL 
  AND is_completed = false
  AND NOT EXISTS (
    SELECT 1 FROM instagram_messages 
    WHERE instagram_messages.sender_id = autoresponder_followups.sender_id
      AND instagram_messages.message_type = 'sent'
      AND instagram_messages.timestamp >= autoresponder_followups.followup_sent_at
      AND instagram_messages.message_text = autoresponder_followups.followup_message_text
  );