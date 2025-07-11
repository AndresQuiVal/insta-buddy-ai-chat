-- Actualizar políticas RLS para incluir comment_autoresponder_id y general_autoresponder_id

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own followup configs" ON public.autoresponder_followup_configs;
DROP POLICY IF EXISTS "Users can create their own followup configs" ON public.autoresponder_followup_configs;
DROP POLICY IF EXISTS "Users can update their own followup configs" ON public.autoresponder_followup_configs;
DROP POLICY IF EXISTS "Users can delete their own followup configs" ON public.autoresponder_followup_configs;

-- Crear nuevas políticas que incluyan todas las referencias posibles
CREATE POLICY "Users can view their own followup configs" ON public.autoresponder_followup_configs
FOR SELECT USING (
  -- Para DM autoresponders
  (autoresponder_message_id IN (
    SELECT autoresponder_messages.id
    FROM autoresponder_messages
    WHERE autoresponder_messages.instagram_user_id_ref IN (
      SELECT instagram_users.instagram_user_id
      FROM instagram_users
      WHERE instagram_users.is_active = true
    )
  )) OR
  -- Para comment autoresponders (siempre permitir ya que no hay autenticación por usuario)
  (comment_autoresponder_id IS NOT NULL) OR
  -- Para general autoresponders (siempre permitir ya que no hay autenticación por usuario)
  (general_autoresponder_id IS NOT NULL)
);

CREATE POLICY "Users can create their own followup configs" ON public.autoresponder_followup_configs
FOR INSERT WITH CHECK (
  -- Para DM autoresponders
  (autoresponder_message_id IN (
    SELECT autoresponder_messages.id
    FROM autoresponder_messages
    WHERE autoresponder_messages.instagram_user_id_ref IN (
      SELECT instagram_users.instagram_user_id
      FROM instagram_users
      WHERE instagram_users.is_active = true
    )
  )) OR
  -- Para comment autoresponders (siempre permitir)
  (comment_autoresponder_id IS NOT NULL) OR
  -- Para general autoresponders (siempre permitir)
  (general_autoresponder_id IS NOT NULL)
);

CREATE POLICY "Users can update their own followup configs" ON public.autoresponder_followup_configs
FOR UPDATE USING (
  -- Para DM autoresponders
  (autoresponder_message_id IN (
    SELECT autoresponder_messages.id
    FROM autoresponder_messages
    WHERE autoresponder_messages.instagram_user_id_ref IN (
      SELECT instagram_users.instagram_user_id
      FROM instagram_users
      WHERE instagram_users.is_active = true
    )
  )) OR
  -- Para comment autoresponders (siempre permitir)
  (comment_autoresponder_id IS NOT NULL) OR
  -- Para general autoresponders (siempre permitir)
  (general_autoresponder_id IS NOT NULL)
);

CREATE POLICY "Users can delete their own followup configs" ON public.autoresponder_followup_configs
FOR DELETE USING (
  -- Para DM autoresponders
  (autoresponder_message_id IN (
    SELECT autoresponder_messages.id
    FROM autoresponder_messages
    WHERE autoresponder_messages.instagram_user_id_ref IN (
      SELECT instagram_users.instagram_user_id
      FROM instagram_users
      WHERE instagram_users.is_active = true
    )
  )) OR
  -- Para comment autoresponders (siempre permitir)
  (comment_autoresponder_id IS NOT NULL) OR
  -- Para general autoresponders (siempre permitir)
  (general_autoresponder_id IS NOT NULL)
);