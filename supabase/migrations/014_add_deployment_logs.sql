-- Add deployment logs and progress tracking to generations table
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS deployment_logs TEXT,
ADD COLUMN IF NOT EXISTS deployment_progress JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN generations.deployment_logs IS 'Full deployment logs from fly.io';
COMMENT ON COLUMN generations.deployment_progress IS 'Array of deployment progress steps: [{step: string, status: "running"|"completed"|"failed", timestamp: string, message?: string}]';
