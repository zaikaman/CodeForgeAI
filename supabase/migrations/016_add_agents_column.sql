-- Add agents column to generations table to store which agents were used

DO $$ 
BEGIN
  -- Add agents column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'agents'
  ) THEN
    ALTER TABLE generations ADD COLUMN agents TEXT[] DEFAULT ARRAY['CodeGenerator'];
    
    -- Add comment explaining the column
    COMMENT ON COLUMN generations.agents IS 'Array of agent names used for this generation';
  END IF;
END $$;

-- Create index for faster agent-based queries
CREATE INDEX IF NOT EXISTS idx_generations_agents 
ON generations USING GIN (agents);
