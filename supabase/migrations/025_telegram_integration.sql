-- Telegram Integration Tables
-- Stores Telegram users linked to CodeForge accounts

-- Table: telegram_users
-- Links Telegram accounts to Supabase users
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by telegram_id
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);

-- Table: telegram_auth_pending
-- Stores pending authentication requests from Telegram
CREATE TABLE IF NOT EXISTS telegram_auth_pending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  auth_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);

-- Index for fast lookup by auth_token
CREATE INDEX IF NOT EXISTS idx_telegram_auth_pending_token ON telegram_auth_pending(auth_token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_telegram_auth_pending_expires ON telegram_auth_pending(expires_at);

-- Table: telegram_settings
-- Stores per-user Telegram settings
CREATE TABLE IF NOT EXISTS telegram_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id UUID NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  background_mode BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_user_id)
);

-- Index for fast lookup by telegram_user_id
CREATE INDEX IF NOT EXISTS idx_telegram_settings_user ON telegram_settings(telegram_user_id);

-- Add telegram_chat_id to background_jobs context for notifications
-- (No schema change needed - context is JSONB, so we can add fields dynamically)

-- Function to clean up expired auth tokens
CREATE OR REPLACE FUNCTION cleanup_expired_telegram_auth()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM telegram_auth_pending
  WHERE expires_at < NOW() AND completed = FALSE;
END;
$$;

-- Grant permissions
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_auth_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_users
CREATE POLICY "Users can view their own telegram account"
  ON telegram_users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram account"
  ON telegram_users
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for telegram_settings
CREATE POLICY "Users can view their own telegram settings"
  ON telegram_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM telegram_users
    WHERE telegram_users.id = telegram_settings.telegram_user_id
    AND telegram_users.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own telegram settings"
  ON telegram_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM telegram_users
    WHERE telegram_users.id = telegram_settings.telegram_user_id
    AND telegram_users.user_id = auth.uid()
  ));

-- Service role can do everything (for bot operations)
CREATE POLICY "Service role can manage telegram_users"
  ON telegram_users
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage telegram_auth_pending"
  ON telegram_auth_pending
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage telegram_settings"
  ON telegram_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE telegram_users IS 'Links Telegram accounts to CodeForge user accounts';
COMMENT ON TABLE telegram_auth_pending IS 'Pending authentication requests from Telegram bot';
COMMENT ON TABLE telegram_settings IS 'User-specific Telegram bot settings';
COMMENT ON FUNCTION cleanup_expired_telegram_auth IS 'Removes expired authentication tokens (run periodically)';
