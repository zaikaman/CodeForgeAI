-- Add status and error tracking to generations table
-- Use IF NOT EXISTS to make migration idempotent

-- Add columns only if they don't exist
DO $$ 
BEGIN
  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'status'
  ) THEN
    ALTER TABLE generations
    ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;

  -- Add error column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'error'
  ) THEN
    ALTER TABLE generations ADD COLUMN error TEXT;
  END IF;

  -- Add agent_thoughts column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'agent_thoughts'
  ) THEN
    ALTER TABLE generations ADD COLUMN agent_thoughts JSONB;
  END IF;

  -- Add target_language column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'target_language'
  ) THEN
    ALTER TABLE generations ADD COLUMN target_language TEXT DEFAULT 'typescript';
  END IF;

  -- Add complexity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'complexity'
  ) THEN
    ALTER TABLE generations ADD COLUMN complexity TEXT;
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE generations ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations(user_id, created_at DESC);

-- Update files column to be nullable (will be populated after processing)
-- Check if files column is currently NOT NULL before changing
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' 
    AND column_name = 'files' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE generations ALTER COLUMN files DROP NOT NULL;
  END IF;
END $$;
