-- Add project_context column to generations table for storing additional context

DO $$ 
BEGIN
  -- Add project_context column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generations' AND column_name = 'project_context'
  ) THEN
    ALTER TABLE generations ADD COLUMN project_context TEXT;
    
    -- Add comment explaining the column
    COMMENT ON COLUMN generations.project_context IS 'Additional context or requirements provided by user for code generation';
  END IF;
END $$;
