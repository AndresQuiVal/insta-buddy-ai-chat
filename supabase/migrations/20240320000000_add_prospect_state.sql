-- Add prospect_state column to instagram_messages table
ALTER TABLE instagram_messages
ADD COLUMN prospect_state text CHECK (prospect_state IN ('first_message_sent', 'reactivation_sent', 'no_response', 'invited', 'presented', 'closed')),
ADD COLUMN is_invitation boolean DEFAULT false,
ADD COLUMN is_presentation boolean DEFAULT false,
ADD COLUMN is_inscription boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_instagram_messages_prospect_state ON instagram_messages(prospect_state);

-- Update existing messages to have a default state
UPDATE instagram_messages
SET prospect_state = 'no_response'
WHERE prospect_state IS NULL; 