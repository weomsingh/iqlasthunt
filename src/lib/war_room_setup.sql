-- War Room Messages Table for Hunter Chat
-- This table stores real-time chat messages for hunters on the same bounty

CREATE TABLE IF NOT EXISTS war_room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Indexes for performance
  CONSTRAINT war_room_messages_bounty_sender_idx UNIQUE (id, bounty_id, sender_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_war_room_bounty ON war_room_messages(bounty_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_sender ON war_room_messages(sender_id);

-- Enable Row Level Security
ALTER TABLE war_room_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hunters can read bounty messages" ON war_room_messages;
DROP POLICY IF EXISTS "Hunters can send messages" ON war_room_messages;

-- Policy: Hunters can read messages for bounties they're staked on
CREATE POLICY "Hunters can read bounty messages"
  ON war_room_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hunter_stakes
      WHERE hunter_stakes.bounty_id = war_room_messages.bounty_id
      AND hunter_stakes.hunter_id = auth.uid()
      AND hunter_stakes.status = 'active'
    )
  );

-- Policy: Hunters can send messages to bounties they're staked on
CREATE POLICY "Hunters can send messages"
  ON war_room_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hunter_stakes
      WHERE hunter_stakes.bounty_id = war_room_messages.bounty_id
      AND hunter_stakes.hunter_id = auth.uid()
      AND hunter_stakes.status = 'active'
    )
    AND sender_id = auth.uid()
  );

-- Enable Realtime for War Room
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'war_room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE war_room_messages;
  END IF;
END $$;

-- Add max_hunters column to bounties table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'max_hunters'
  ) THEN
    ALTER TABLE bounties ADD COLUMN max_hunters INTEGER DEFAULT 10 CHECK (max_hunters > 0);
  END IF;
END $$;

-- Function to automatically purge war room messages when bounty completes
CREATE OR REPLACE FUNCTION purge_war_room_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If bounty status changed to 'completed', delete all war room messages
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    DELETE FROM war_room_messages WHERE bounty_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic purge
DROP TRIGGER IF EXISTS trigger_purge_war_room ON bounties;
CREATE TRIGGER trigger_purge_war_room
  AFTER UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION purge_war_room_on_completion();

-- Grant permissions
GRANT SELECT, INSERT ON war_room_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE war_room_messages IS 'Real-time chat messages for hunters on the same bounty. Messages are automatically purged when bounty completes.';
COMMENT ON FUNCTION purge_war_room_on_completion() IS 'Automatically deletes all war room messages when a bounty is completed for security and privacy.';
