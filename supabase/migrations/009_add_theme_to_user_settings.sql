-- Add theme column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'green' CHECK (theme IN ('blue', 'green'));

-- Add comment
COMMENT ON COLUMN user_settings.theme IS 'User selected theme: blue or green';
